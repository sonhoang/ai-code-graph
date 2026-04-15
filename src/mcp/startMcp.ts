import fs from "fs";
import path from "path";
import { z } from "zod";
import { loadConfig } from "../config/loadConfig";
import { runSignatureScan } from "../commands/signatureSearch";

const SearchInput = z.object({
  pattern: z.string().describe("Case-insensitive substring on symbol name or signature line"),
  paths: z.array(z.string()).optional().describe('Scan roots relative to cwd (default ["."])'),
  includeNonExported: z
    .boolean()
    .optional()
    .describe("Include non-exported symbols (noisier; default false)")
});

const ExtractInput = z.object({
  paths: z.array(z.string()).optional().describe('Scan roots relative to cwd (default ["."])'),
  includeNonExported: z.boolean().optional().describe("Include non-exported symbols (default false)")
});

export async function startMcpServer(): Promise<void> {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio");

  const pkgPath = path.join(__dirname, "..", "..", "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string };

  const server = new McpServer(
    { name: "ai-code-graph", version: pkg.version },
    {
      instructions:
        "For locating TypeScript functions, classes, interfaces, types, or enums, call `search` or `extract` first. " +
        "They return compact path:line + signature lines (bodies omitted) to save tokens—then read only the needed file ranges. " +
        "Prefer this over project-wide grep for declaration discovery. For non-code or string-literal search, use normal grep."
    }
  );

  server.registerTool(
    "search",
    {
      title: "Search TS signatures",
      description:
        "Find exported TypeScript signatures matching a pattern (vfs-style compact output). Use before reading whole files.",
      inputSchema: SearchInput
    },
    async args => {
      const cwd = process.cwd();
      const config = loadConfig(cwd);
      const { lines, stats } = await runSignatureScan(cwd, config, args.paths, {
        pattern: args.pattern,
        exportedOnly: !args.includeNonExported
      });
      const body = lines.length ? lines.join("\n") : "(no matches)";
      const text = `files_scanned: ${stats.files}\nmatches: ${stats.hits}\n\n${body}`;
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "extract",
    {
      title: "Extract TS signatures",
      description:
        "List exported TypeScript signatures for paths (no bodies). Equivalent to search without a name filter.",
      inputSchema: ExtractInput
    },
    async args => {
      const cwd = process.cwd();
      const config = loadConfig(cwd);
      const { lines, stats } = await runSignatureScan(cwd, config, args.paths, {
        exportedOnly: !args.includeNonExported
      });
      const body = lines.length ? lines.join("\n") : "(no symbols)";
      const text = `files_scanned: ${stats.files}\nmatches: ${stats.hits}\n\n${body}`;
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "list_languages",
    {
      title: "Supported extensions",
      description: "Languages/extensions supported by ai-code-graph compact scan (MVP: TypeScript only)."
    },
    async () => {
      const text = JSON.stringify(
        {
          typescript: [".ts", ".tsx", ".mts", ".cts"],
          note: "Full graph.json from `ai-code-graph create` remains TypeScript-oriented; other languages may be added later."
        },
        null,
        2
      );
      return { content: [{ type: "text" as const, text }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
