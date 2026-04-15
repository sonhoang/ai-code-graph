import fs from "fs";
import { resolveOutputDir, type ResolvedConfig } from "../config/loadConfig";
import { graphPath, overviewPath, readGraph, writeReview } from "../graph/store";
import { chatCompletion } from "../llm/openaiCompatible";

export async function runReview(cwd: string, config: ResolvedConfig): Promise<void> {
  const outDir = resolveOutputDir(cwd, config.outputDir);
  if (!fs.existsSync(graphPath(outDir))) {
    throw new Error(`No graph found. Run "ai-code-graph create" first (expected ${graphPath(outDir)}).`);
  }

  const graph = readGraph(outDir);
  const overviewFs = overviewPath(outDir);
  const overview = fs.existsSync(overviewFs) ? fs.readFileSync(overviewFs, "utf8") : "";

  const graphJson = JSON.stringify(graph, null, 2);
  const maxChars = Number(process.env.AI_CODE_GRAPH_MAX_CONTEXT ?? 120_000);
  const clipped =
    graphJson.length > maxChars
      ? `${graphJson.slice(0, maxChars)}\n\n… [truncated: graph.json length ${graphJson.length}; set AI_CODE_GRAPH_MAX_CONTEXT to raise]`
      : graphJson;

  const user = [
    "## overview.md",
    overview || "_(missing — run create/sync)_",
    "",
    "## graph.json",
    clipped
  ].join("\n");

  const md = await chatCompletion(config.llm, user);
  const banner = `<!-- ai-code-graph review | ${new Date().toISOString()} | model: ${config.llm.model} -->\n\n`;
  writeReview(outDir, banner + md);
}
