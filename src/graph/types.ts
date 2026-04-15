export type GraphNodeKind =
  | "file"
  | "function"
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "variable"
  | "namespace";

export type GraphEdgeKind =
  | "imports"
  | "exports_to"
  | "contains"
  | "extends"
  | "implements"
  | "references_type";

export type GraphFileNode = {
  id: string;
  kind: "file";
  path: string;
};

export type GraphSymbolNode = {
  id: string;
  kind: Exclude<GraphNodeKind, "file">;
  name: string;
  file: string;
  line: number;
  /** Short preview (signature / type text) */
  detail?: string;
};

export type GraphNode = GraphFileNode | GraphSymbolNode;

export type GraphEdge = {
  from: string;
  to: string;
  kind: GraphEdgeKind;
  /** Original module specifier when kind is imports/exports_to */
  specifier?: string;
};

export type GraphDocument = {
  version: 1;
  generatedAt: string;
  root: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphMeta = {
  version: 1;
  lastSyncAt?: string;
  files: Record<
    string,
    {
      hash: string;
    }
  >;
};

export type LlmConfig = {
  provider?: "openai";
  model?: string;
  baseURL?: string;
  apiKey?: string;
};

export type AiCodeGraphConfig = {
  /** Glob patterns, relative to project root */
  include?: string[];
  exclude?: string[];
  /** Output directory (default: ".ai-code-graph"). Use e.g. "ai-code-graph" if you prefer a non-hidden folder. */
  outputDir?: string;
  llm?: LlmConfig;
};
