import fs from "fs";
import type { ResolvedConfig } from "../config/loadConfig";
import { extractCompactSignatures, formatVfsLine, type CompactSignatureHit } from "../scanner/compact";
import { resolveScanFiles } from "./resolveScanFiles";

export type SignatureSearchOptions = {
  /** Case-insensitive substring on name or signature */
  pattern?: string;
  /** If true, only symbols with an export modifier (vfs default) */
  exportedOnly?: boolean;
};

function matchesPattern(hit: CompactSignatureHit, pattern: string): boolean {
  const p = pattern.toLowerCase();
  return hit.name.toLowerCase().includes(p) || hit.signature.toLowerCase().includes(p);
}

export async function runSignatureScan(
  cwd: string,
  config: ResolvedConfig,
  paths: string[] | undefined,
  opts: SignatureSearchOptions
): Promise<{ lines: string[]; hits: CompactSignatureHit[]; stats: { files: number; hits: number } }> {
  const files = await resolveScanFiles(cwd, paths, config);
  const hits: CompactSignatureHit[] = [];
  for (const abs of files) {
    const content = fs.readFileSync(abs, "utf8");
    for (const h of extractCompactSignatures(abs, content, cwd)) {
      if (opts.exportedOnly !== false && !h.exported) continue;
      if (opts.pattern && !matchesPattern(h, opts.pattern)) continue;
      hits.push(h);
    }
  }
  hits.sort((a, b) => a.rel.localeCompare(b.rel) || a.line - b.line);
  const lines = hits.map(formatVfsLine);
  return { lines, hits, stats: { files: files.length, hits: hits.length } };
}
