import ts from "typescript";
import { normalizeRelPath, toPosix } from "../graph/paths";

export type CompactSignatureHit = {
  rel: string;
  line: number;
  name: string;
  exported: boolean;
  /** Signature only (no function/class bodies) — vfs-style compact output */
  signature: string;
};

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return mods?.some(m => m.kind === kind) ?? false;
}

function getExportableStatement(node: ts.Node): ts.Statement | undefined {
  if (ts.isVariableDeclaration(node)) {
    let p: ts.Node = node.parent;
    if (ts.isVariableDeclarationList(p)) p = p.parent;
    if (ts.isVariableStatement(p)) return p;
    return undefined;
  }
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isModuleDeclaration(node)
  ) {
    return node as ts.Statement;
  }
  return undefined;
}

function isExported(node: ts.Node, _sf: ts.SourceFile): boolean {
  const stmt = getExportableStatement(node);
  if (!stmt) return false;
  return (
    hasModifier(stmt, ts.SyntaxKind.ExportKeyword) || hasModifier(stmt, ts.SyntaxKind.DefaultKeyword)
  );
}

function normalizeSig(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function signatureOnly(sf: ts.SourceFile, node: ts.Node): string {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
    const body = node.body;
    if (body) {
      const end = body.getFullStart();
      return normalizeSig(sf.text.slice(node.getStart(sf), end));
    }
    return normalizeSig(node.getText(sf));
  }
  if (ts.isArrowFunction(node)) {
    if (node.body) {
      const end = ts.isBlock(node.body) ? node.body.getFullStart() : node.body.getStart(sf);
      return normalizeSig(sf.text.slice(node.getStart(sf), end));
    }
    return normalizeSig(node.getText(sf));
  }
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    const t = node.getText(sf);
    const i = t.indexOf("{");
    return normalizeSig(i >= 0 ? t.slice(0, i) : t);
  }
  if (ts.isEnumDeclaration(node)) {
    const t = node.getText(sf);
    const i = t.indexOf("{");
    return normalizeSig(i >= 0 ? t.slice(0, i) : t);
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return normalizeSig(node.getText(sf));
  }
  if (ts.isModuleDeclaration(node)) {
    const t = node.getText(sf);
    const i = t.indexOf("{");
    return normalizeSig(i >= 0 ? t.slice(0, i) : t);
  }
  if (ts.isVariableDeclaration(node)) {
    const init = node.initializer;
    if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
      const name = node.name.getText(sf);
      const rhs = signatureOnly(sf, init);
      const vdl = node.parent;
      if (!ts.isVariableDeclarationList(vdl)) return normalizeSig(`${name} = ${rhs}`);
      const stmt = vdl.parent;
      let keyword = "var";
      if (vdl.flags & ts.NodeFlags.Const) keyword = "const";
      else if (vdl.flags & ts.NodeFlags.Let) keyword = "let";
      if (stmt && ts.isVariableStatement(stmt)) {
        const exported = hasModifier(stmt, ts.SyntaxKind.ExportKeyword);
        const lead = exported ? `export ${keyword}` : keyword;
        return normalizeSig(`${lead} ${name} = ${rhs}`);
      }
      return normalizeSig(`${keyword} ${name} = ${rhs}`);
    }
  }
  return normalizeSig(node.getText(sf)).slice(0, 240);
}

function getName(node: ts.Node): string | null {
  if (ts.isModuleDeclaration(node)) {
    if (ts.isIdentifier(node.name)) return node.name.text;
    if (ts.isStringLiteral(node.name)) return node.name.text;
  }
  const nm = (node as ts.NamedDeclaration).name;
  if (nm && ts.isIdentifier(nm)) return nm.text;
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) return node.name.text;
  if (nm && ts.isComputedPropertyName(nm)) return "[computed]";
  return null;
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  const pos = node.getStart(sf, false);
  return sf.getLineAndCharacterOfPosition(pos).line + 1;
}

function containingClassLike(node: ts.Node): ts.ClassLikeDeclaration | undefined {
  let p: ts.Node | undefined = node.parent;
  while (p) {
    if (ts.isClassDeclaration(p) || ts.isClassExpression(p)) return p;
    p = p.parent;
  }
  return undefined;
}

/**
 * vfs-style: exported declarations only, signatures without bodies, skip class methods.
 */
export function extractCompactSignatures(absPath: string, content: string, root: string): CompactSignatureHit[] {
  const rel = toPosix(normalizeRelPath(root, absPath));
  const scriptKind = absPath.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(rel, content, ts.ScriptTarget.Latest, true, scriptKind);
  const hits: CompactSignatureHit[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isMethodDeclaration(node)) {
      ts.forEachChild(node, visit);
      return;
    }

    let capture: ts.Node | null = null;
    if (ts.isFunctionDeclaration(node) && !containingClassLike(node)) capture = node;
    else if (ts.isClassDeclaration(node) && !containingClassLike(node)) capture = node;
    else if (ts.isInterfaceDeclaration(node)) capture = node;
    else if (ts.isEnumDeclaration(node)) capture = node;
    else if (ts.isTypeAliasDeclaration(node)) capture = node;
    else if (ts.isModuleDeclaration(node) && node.body && ts.isModuleBlock(node.body)) capture = node;
    else if (
      ts.isVariableDeclaration(node) &&
      !containingClassLike(node) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      capture = node;
    }

    if (capture) {
      const name = getName(capture);
      if (name) {
        const exported = isExported(capture, sf);
        hits.push({
          rel,
          line: lineOf(sf, capture),
          name,
          exported,
          signature: signatureOnly(sf, capture)
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sf);
  return hits;
}

export function formatVfsLine(hit: CompactSignatureHit): string {
  return `${hit.rel}:${hit.line}:\t${hit.signature}`;
}
