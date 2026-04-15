#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { loadConfig } from "./config/loadConfig";
import { runCreate } from "./commands/create";
import { runSync } from "./commands/sync";
import { runReview } from "./commands/review";
import { runSignatureScan } from "./commands/signatureSearch";

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string };

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("ai-code-graph")
    .description("Build a TypeScript codebase graph for AI-assisted review.")
    .version(pkg.version);

  program
    .command("create")
    .description("Scan the repo and build graph.json + overview.md")
    .action(async () => {
      const cwd = process.cwd();
      await runCreate(cwd, loadConfig(cwd));
    });

  program
    .command("sync")
    .description("Incrementally update the graph for changed files only")
    .action(async () => {
      const cwd = process.cwd();
      await runSync(cwd, loadConfig(cwd));
    });

  program
    .command("review")
    .description("Call the configured LLM and write review.md")
    .action(async () => {
      const cwd = process.cwd();
      await runReview(cwd, loadConfig(cwd));
    });

  program
    .command("search")
    .description("vfs-style: compact exported signatures; filter by name/signature substring")
    .argument("[paths...]", "scan roots (default: .)")
    .option("-f, --filter <pattern>", "case-insensitive substring")
    .option("--all", "include non-exported symbols")
    .action(async (paths: string[], opts: { filter?: string; all?: boolean }) => {
      const cwd = process.cwd();
      const config = loadConfig(cwd);
      const roots = paths.length ? paths : undefined;
      const { lines, stats } = await runSignatureScan(cwd, config, roots, {
        pattern: opts.filter,
        exportedOnly: !opts.all
      });
      if (process.stderr.isTTY) {
        console.error(`ai-code-graph search: files=${stats.files} matches=${stats.hits}`);
      }
      console.log(lines.join("\n"));
    });

  program
    .command("extract")
    .description("List exported compact signatures for paths (no filter)")
    .argument("[paths...]", "scan roots (default: .)")
    .option("--all", "include non-exported symbols")
    .action(async (paths: string[], opts: { all?: boolean }) => {
      const cwd = process.cwd();
      const config = loadConfig(cwd);
      const roots = paths.length ? paths : undefined;
      const { lines, stats } = await runSignatureScan(cwd, config, roots, {
        exportedOnly: !opts.all
      });
      if (process.stderr.isTTY) {
        console.error(`ai-code-graph extract: files=${stats.files} matches=${stats.hits}`);
      }
      console.log(lines.join("\n"));
    });

  program
    .command("mcp")
    .description("Start MCP server (stdio) — add to Cursor mcp.json: command ai-code-graph, args [\"mcp\"]")
    .action(async () => {
      const { startMcpServer } = await import("./mcp/startMcp");
      await startMcpServer();
    });

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
