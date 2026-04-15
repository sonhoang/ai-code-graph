import fs from "fs";
import path from "path";
import createJiti from "jiti";
import type { AiCodeGraphConfig } from "../graph/types";

const CONFIG_NAMES = [
  "ai-code-graph.config.ts",
  "ai-code-graph.config.mts",
  "ai-code-graph.config.cts",
  "ai-code-graph.config.js",
  "ai-code-graph.config.cjs",
  "ai-code-graph.config.mjs"
];

const defaultConfig: AiCodeGraphConfig = {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  outputDir: ".ai-code-graph",
  llm: {
    provider: "openai",
    model: "gpt-4o-mini",
    baseURL: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  }
};

export type ResolvedConfig = Required<
  Pick<AiCodeGraphConfig, "include" | "exclude" | "outputDir">
> &
  AiCodeGraphConfig & {
    llm: Required<LlmResolved>;
  };

type LlmResolved = {
  provider: "openai";
  model: string;
  baseURL: string;
  apiKey: string | undefined;
};

function mergeLlm(base: LlmResolved, patch?: AiCodeGraphConfig["llm"]): LlmResolved {
  return {
    provider: "openai",
    model: patch?.model ?? base.model,
    baseURL: patch?.baseURL ?? base.baseURL,
    apiKey: patch?.apiKey ?? base.apiKey
  };
}

export function loadConfig(cwd: string): ResolvedConfig {
  let fileConfig: AiCodeGraphConfig = {};
  for (const name of CONFIG_NAMES) {
    const full = path.join(cwd, name);
    if (!fs.existsSync(full)) continue;
    const jiti = createJiti(__filename, { interopDefault: true });
    const mod = jiti(full) as { default?: AiCodeGraphConfig } | AiCodeGraphConfig;
    fileConfig = (typeof mod === "object" && mod && "default" in mod && mod.default
      ? mod.default
      : mod) as AiCodeGraphConfig;
    break;
  }

  const include = fileConfig.include ?? defaultConfig.include!;
  const exclude = fileConfig.exclude ?? defaultConfig.exclude!;
  const outputDir = fileConfig.outputDir ?? defaultConfig.outputDir!;

  const baseLlm: LlmResolved = {
    provider: "openai",
    model: defaultConfig.llm?.model ?? "gpt-4o-mini",
    baseURL: defaultConfig.llm?.baseURL ?? "https://api.openai.com/v1",
    apiKey: defaultConfig.llm?.apiKey
  };

  return {
    ...fileConfig,
    include,
    exclude,
    outputDir,
    llm: mergeLlm(baseLlm, fileConfig.llm)
  };
}

export function resolveOutputDir(cwd: string, outputDir: string): string {
  return path.resolve(cwd, outputDir);
}
