import fs from "fs";
import path from "path";
import crypto from "crypto";
import ts from "typescript";
import { normalizeRelPath, toPosix } from "../graph/paths";
import type { GraphEdge, GraphNode, GraphSymbolNode } from "../graph/types";

export function hashContent(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function symId(rel: string, name: string, line: number): string {
  return `sym:${toPosix(rel)}#L${line}:${name}`;
}

function resolveImportTarget(root: string, importerAbs: string, specifier: string): string | null {
  if (specifier.startsWith("node:")) return null;
  if (!specifier.startsWith(".") && !specifier.startsWith("/")) {
    return null;
  }
  const base = path.resolve(path.dirname(importerAbs), specifier);
  const trials: string[] = [];
  const noExt = base;
  trials.push(noExt, `${noExt}.ts`, `${noExt}.tsx`, `${noExt}.mts`, `${noExt}.cts`);
  trials.push(path.join(noExt, "index.ts"), path.join(noExt, "index.tsx"));
  for (const t of trials) {
    if (fs.existsSync(t) && fs.statSync(t).isFile()) {
      return t;
    }
  }
  return null;
}

function getName(node: ts.Node): string | null {
  if (ts.isModuleDeclaration(node)) {
    if (ts.isIdentifier(node.name)) return node.name.text;
    if (ts.isStringLiteral(node.name)) return node.name.text;
  }
  const nm = (node as ts.NamedDeclaration).name;
  if (nm && ts.isIdentifier(nm)) return nm.text;
  if (nm && ts.isComputedPropertyName(nm)) return "[computed]";
  return null;
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  const pos = node.getStart(sf, false);
  return sf.getLineAndCharacterOfPosition(pos).line + 1;
}

function textPreview(sf: ts.SourceFile, node: ts.Node, max = 120): string | undefined {
  const t = node.getText(sf).replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function scanTypeScriptFile(absPath: string, content: string, root: string): {
  rel: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const rel = toPosix(normalizeRelPath(root, absPath));
  const fileId = `file:${rel}`;
  const nodes: GraphNode[] = [{ id: fileId, kind: "file", path: rel }];
  const edges: GraphEdge[] = [];

  const scriptKind = absPath.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(rel, content, ts.ScriptTarget.Latest, true, scriptKind);

  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteralLike(stmt.moduleSpecifier)) {
      const spec = stmt.moduleSpecifier.text;
      const targetAbs = resolveImportTarget(root, absPath, spec);
      const toId = targetAbs
        ? `file:${toPosix(normalizeRelPath(root, targetAbs))}`
        : `ext:${spec}`;
      edges.push({ from: fileId, to: toId, kind: "imports", specifier: spec });
      continue;
    }

    if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteralLike(stmt.moduleSpecifier)) {
      const spec = stmt.moduleSpecifier.text;
      const targetAbs = resolveImportTarget(root, absPath, spec);
      const toId = targetAbs
        ? `file:${toPosix(normalizeRelPath(root, targetAbs))}`
        : `ext:${spec}`;
      edges.push({ from: fileId, to: toId, kind: "exports_to", specifier: spec });
    }
  }

  const visit = (node: ts.Node): void => {
    let symKind: GraphSymbolNode["kind"] | null = null;
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) symKind = "function";
    else if (ts.isClassDeclaration(node)) symKind = "class";
    else if (ts.isInterfaceDeclaration(node)) symKind = "interface";
    else if (ts.isEnumDeclaration(node)) symKind = "enum";
    else if (ts.isTypeAliasDeclaration(node)) symKind = "type";
    else if (ts.isModuleDeclaration(node)) symKind = "namespace";
    else if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      symKind = "function";
    }

    if (symKind) {
      const name = getName(node);
      if (name) {
        const line = lineOf(sf, node);
        const id = symId(rel, name, line);
        const detail = textPreview(sf, node);
        nodes.push({
          id,
          kind: symKind,
          name,
          file: rel,
          line,
          detail
        });
        edges.push({ from: fileId, to: id, kind: "contains" });
      }
    }

    if (ts.isHeritageClause(node)) {
      for (const t of node.types) {
        const tn = t.expression.getText(sf);
        const owner = node.parent;
        if (ts.isClassDeclaration(owner) || ts.isInterfaceDeclaration(owner)) {
          const ownerName = getName(owner);
          if (ownerName) {
            const line = lineOf(sf, owner);
            const fromId = symId(rel, ownerName, line);
            const edgeKind = node.token === ts.SyntaxKind.ExtendsKeyword ? "extends" : "implements";
            edges.push({ from: fromId, to: `type:${tn}`, kind: edgeKind });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);

  return { rel, nodes, edges };
}
