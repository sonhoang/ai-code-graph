import axios from "axios";
import type { ResolvedConfig } from "../config/loadConfig";

function chatCompletionsUrl(baseURL: string): string {
  const trimmed = baseURL.replace(/\/$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

export async function chatCompletion(
  llm: ResolvedConfig["llm"],
  userMessage: string,
  system =
    "You are a senior engineer. Use ONLY the provided codebase graph context. Be concise: risks, bugs, missing tests, API/typing issues. Use bullet points."
): Promise<string> {
  const url = chatCompletionsUrl(llm.baseURL);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (llm.apiKey) headers.Authorization = `Bearer ${llm.apiKey}`;

  const res = await axios.post(
    url,
    {
      model: llm.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      temperature: 0.2
    },
    { headers, timeout: 120_000, validateStatus: () => true }
  );

  if (res.status >= 400) {
    const msg =
      (res.data as { error?: { message?: string } })?.error?.message ||
      `LLM request failed (${res.status})`;
    throw new Error(msg);
  }

  const text = (res.data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message
    ?.content;
  if (!text) throw new Error("Empty LLM response");
  return text;
}
