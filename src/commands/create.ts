import fs from "fs";
import fg from "fast-glob";
import { resolveOutputDir, type ResolvedConfig } from "../config/loadConfig";
import { emptyGraph, replaceFileInGraph } from "../graph/merge";
import type { GraphMeta } from "../graph/types";
import { writeGraph, writeMeta, writeOverview } from "../graph/store";
import { renderOverview } from "../graph/overview";
import { hashContent, scanTypeScriptFile } from "../scanner/tsScanner";
import { normalizeRelPath, toPosix } from "../graph/paths";

export async function runCreate(cwd: string, config: ResolvedConfig): Promise<void> {
  const outDir = resolveOutputDir(cwd, config.outputDir);
  const files = await fg(config.include, {
    cwd,
    ignore: config.exclude,
    absolute: true,
    onlyFiles: true
  });

  let doc = emptyGraph(cwd);
  const meta: GraphMeta = { version: 1, files: {} };

  for (const abs of files.sort()) {
    if (!isTs(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    const { rel, nodes, edges } = scanTypeScriptFile(abs, content, cwd);
    doc = replaceFileInGraph(doc, rel, nodes, edges);
    meta.files[toPosix(normalizeRelPath(cwd, abs))] = { hash: hashContent(content) };
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
