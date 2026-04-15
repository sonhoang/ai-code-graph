import type { GraphDocument, GraphSymbolNode } from "./types";

function isSymbol(n: GraphDocument["nodes"][number]): n is GraphSymbolNode {
  return n.kind !== "file";
}

/** Compact, LLM-friendly summary (Markdown) alongside heavy graph.json. */
export function renderOverview(doc: GraphDocument): string {
  const files = doc.nodes.filter(n => n.kind === "file") as Array<{ path: string }>;
  const byFile = new Map<string, GraphSymbolNode[]>();
  for (const n of doc.nodes) {
    if (!isSymbol(n)) continue;
    const list = byFile.get(n.file) ?? [];
    list.push(n);
    byFile.set(n.file, list);
  }

  const importEdges = doc.edges.filter(e => e.kind === "imports");
  const lines: string[] = [];
  lines.push(`# Code graph overview`);
  lines.push(``);
  lines.push(`- **Root:** \`${doc.root}\``);
  lines.push(`- **Generated:** ${doc.generatedAt}`);
  lines.push(`- **Files:** ${files.length}`);
  lines.push(`- **Symbols:** ${doc.nodes.length - files.length}`);
  lines.push(`- **Edges:** ${doc.edges.length}`);
  lines.push(``);
  lines.push(`## Files & top-level symbols`);
  lines.push(``);

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const f of sortedFiles) {
    lines.push(`### \`${f.path}\``);
    const syms = (byFile.get(f.path) ?? []).sort((a, b) => a.line - b.line);
    if (syms.length === 0) {
      lines.push(`_(no extracted symbols)_`);
    } else {
      for (const s of syms) {
        const d = "detail" in s && s.detail ? ` — _${s.detail}_` : "";
        lines.push(`- **${s.kind}** \`${s.name}\` (L${s.line})${d}`);
      }
    }
    const outgoing = importEdges.filter(e => e.from === `file:${f.path}`);
    if (outgoing.length) {
      lines.push(`- **imports:** ${outgoing.map(e => `\`${e.specifier ?? e.to}\``).join(", ")}`);
    }
    lines.push(``);
  }

  lines.push(`## Import map (file → file)`);
  lines.push(``);
  for (const e of importEdges.sort((a, b) => a.from.localeCompare(b.from))) {
    lines.push(`- \`${edgeFromLabel(e.from)}\` → \`${edgeToLabel(e.to)}\`${e.specifier ? ` (${e.specifier})` : ""}`);
  }

  return lines.join("\n");
}

function edgeFromLabel(id: string): string {
  if (id.startsWith("file:")) return id.slice("file:".length);
  return id;
}

function edgeToLabel(id: string): string {
  if (id.startsWith("file:")) return id.slice("file:".length);
  return id;
}
