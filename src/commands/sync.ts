import fs from "fs";
import fg from "fast-glob";
import { resolveOutputDir, type ResolvedConfig } from "../config/loadConfig";
import { emptyGraph, replaceFileInGraph, stripDeletedFiles } from "../graph/merge";
import { readGraph, readMeta, writeGraph, writeMeta, writeOverview } from "../graph/store";
import { renderOverview } from "../graph/overview";
import { hashContent, scanTypeScriptFile } from "../scanner/tsScanner";
import { normalizeRelPath, toPosix } from "../graph/paths";

export async function runSync(cwd: string, config: ResolvedConfig): Promise<void> {
  const outDir = resolveOutputDir(cwd, config.outputDir);
  let doc = readGraph(outDir) ?? emptyGraph(cwd);
  doc.root = cwd;

  let meta = readMeta(outDir);
  const files = await fg(config.include, {
    cwd,
    ignore: config.exclude,
    absolute: true,
    onlyFiles: true
  });

  const current = new Set<string>();
  for (const abs of files) {
    if (!isTs(abs)) continue;
    current.add(toPosix(normalizeRelPath(cwd, abs)));
  }

  const deleted = Object.keys(meta.files).filter(rel => !current.has(rel));
  if (deleted.length) doc = stripDeletedFiles(doc, deleted);
  for (const rel of deleted) delete meta.files[rel];

  for (const abs of files.sort()) {
    if (!isTs(abs)) continue;
    const rel = toPosix(normalizeRelPath(cwd, abs));
    const content = fs.readFileSync(abs, "utf8");
    const h = hashContent(content);
    if (meta.files[rel]?.hash === h) continue;
    const { nodes, edges } = scanTypeScriptFile(abs, content, cwd);
    doc = replaceFileInGraph(doc, rel, nodes, edges);
    meta.files[rel] = { hash: h };
  }

  const now = new Date().toISOString();
  doc.generatedAt = now;
  meta.lastSyncAt = now;

  writeGraph(outDir, doc);
  writeMeta(outDir, meta);
  writeOverview(outDir, renderOverview(doc));
}

function isTs(abs: string): boolean {
  return abs.endsWith(".ts") || abs.endsWith(".tsx") || abs.endsWith(".mts") || abs.endsWith(".cts");
}
