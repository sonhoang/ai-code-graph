import { defineConfig } from "ai-code-graph";

export default defineConfig({
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],

  /** Default: ".ai-code-graph" (hidden). Use "ai-code-graph" if you prefer a normal folder. */
  outputDir: ".ai-code-graph",

  llm: {
    provider: "openai",
    model: "gpt-4o-mini",
    // OpenAI-compatible endpoint (e.g. local gateway)
    baseURL: "http://localhost:4000/v1",
    apiKey: process.env.OPENAI_API_KEY
  }
});
