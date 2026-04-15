# Code graph overview

- **Root:** `/Users/sonhoang/Documents/CST/ai-code-graph`
- **Generated:** 2026-04-15T14:06:24.428Z
- **Files:** 14
- **Symbols:** 52
- **Edges:** 101

## Files & top-level symbols

### `src/cli.ts`
- **function** `main` (L13) — _async function main(): Promise<void> { const program = new Command(); program .name("ai-code-graph") .description("Build…_
- **imports:** `commander`, `fs`, `path`, `./config/loadConfig`, `./commands/create`, `./commands/sync`, `./commands/review`

### `src/commands/create.ts`
- **function** `runCreate` (L11) — _export async function runCreate(cwd: string, config: ResolvedConfig): Promise<void> { const outDir = resolveOutputDir(cw…_
- **function** `isTs` (L40) — _function isTs(abs: string): boolean { return abs.endsWith(".ts") || abs.endsWith(".tsx") || abs.endsWith(".mts") || abs.…_
- **imports:** `fs`, `fast-glob`, `../config/loadConfig`, `../graph/merge`, `../graph/types`, `../graph/store`, `../graph/overview`, `../scanner/tsScanner`, `../graph/paths`

### `src/commands/review.ts`
- **function** `runReview` (L6) — _export async function runReview(cwd: string, config: ResolvedConfig): Promise<void> { const outDir = resolveOutputDir(cw…_
- **imports:** `fs`, `../config/loadConfig`, `../graph/store`, `../llm/openaiCompatible`

### `src/commands/sync.ts`
- **function** `runSync` (L10) — _export async function runSync(cwd: string, config: ResolvedConfig): Promise<void> { const outDir = resolveOutputDir(cwd,…_
- **function** `isTs` (L53) — _function isTs(abs: string): boolean { return abs.endsWith(".ts") || abs.endsWith(".tsx") || abs.endsWith(".mts") || abs.…_
- **imports:** `fs`, `fast-glob`, `../config/loadConfig`, `../graph/merge`, `../graph/store`, `../graph/overview`, `../scanner/tsScanner`, `../graph/paths`

### `src/config/defineConfig.ts`
- **function** `defineConfig` (L3) — _export function defineConfig(config: AiCodeGraphConfig): AiCodeGraphConfig { return config; }_
- **imports:** `../graph/types`

### `src/config/loadConfig.ts`
- **type** `ResolvedConfig` (L27) — _export type ResolvedConfig = Required< Pick<AiCodeGraphConfig, "include" | "exclude" | "outputDir"> > & AiCodeGraphConfi…_
- **type** `LlmResolved` (L34) — _type LlmResolved = { provider: "openai"; model: string; baseURL: string; apiKey: string | undefined; };_
- **function** `mergeLlm` (L41) — _function mergeLlm(base: LlmResolved, patch?: AiCodeGraphConfig["llm"]): LlmResolved { return { provider: "openai", model…_
- **function** `loadConfig` (L50) — _export function loadConfig(cwd: string): ResolvedConfig { let fileConfig: AiCodeGraphConfig = {}; for (const name of CON…_
- **function** `resolveOutputDir` (L83) — _export function resolveOutputDir(cwd: string, outputDir: string): string { return path.resolve(cwd, outputDir); }_
- **imports:** `fs`, `path`, `jiti`, `../graph/types`

### `src/graph/merge.ts`
- **function** `collectIdsToRemove` (L3) — _function collectIdsToRemove(relFile: string, nodes: GraphNode[]): Set<string> { const drop = new Set<string>(); const po…_
- **function** `replaceFileInGraph` (L17) — _export function replaceFileInGraph( doc: GraphDocument, relFile: string, nextNodes: GraphNode[], nextEdges: GraphEdge[] …_
- **function** `stripDeletedFiles` (L29) — _export function stripDeletedFiles(doc: GraphDocument, deletedRelFiles: string[]): GraphDocument { let out = doc; for (co…_
- **function** `emptyGraph` (L42) — _export function emptyGraph(root: string): GraphDocument { return { version: 1, generatedAt: new Date().toISOString(), ro…_
- **imports:** `./types`

### `src/graph/overview.ts`
- **function** `isSymbol` (L3) — _function isSymbol(n: GraphDocument["nodes"][number]): n is GraphSymbolNode { return n.kind !== "file"; }_
- **function** `renderOverview` (L8) — _export function renderOverview(doc: GraphDocument): string { const files = doc.nodes.filter(n => n.kind === "file") as A…_
- **function** `edgeFromLabel` (L59) — _function edgeFromLabel(id: string): string { if (id.startsWith("file:")) return id.slice("file:".length); return id; }_
- **function** `edgeToLabel` (L64) — _function edgeToLabel(id: string): string { if (id.startsWith("file:")) return id.slice("file:".length); return id; }_
- **imports:** `./types`

### `src/graph/paths.ts`
- **function** `normalizeRelPath` (L3) — _export function normalizeRelPath(root: string, absPath: string): string { const rel = path.relative(root, absPath); retu…_
- **function** `toPosix` (L8) — _export function toPosix(p: string): string { return p.split(path.sep).join("/"); }_
- **imports:** `path`

### `src/graph/store.ts`
- **function** `graphPath` (L5) — _export function graphPath(dir: string): string { return path.join(dir, "graph.json"); }_
- **function** `metaPath` (L9) — _export function metaPath(dir: string): string { return path.join(dir, "meta.json"); }_
- **function** `reviewPath` (L13) — _export function reviewPath(dir: string): string { return path.join(dir, "review.md"); }_
- **function** `overviewPath` (L17) — _export function overviewPath(dir: string): string { return path.join(dir, "overview.md"); }_
- **function** `ensureDir` (L21) — _export function ensureDir(dir: string): void { fs.mkdirSync(dir, { recursive: true }); }_
- **function** `readGraph` (L25) — _export function readGraph(dir: string): GraphDocument | null { const p = graphPath(dir); if (!fs.existsSync(p)) return n…_
- **function** `readMeta` (L31) — _export function readMeta(dir: string): GraphMeta { const p = metaPath(dir); if (!fs.existsSync(p)) return { version: 1, …_
- **function** `writeGraph` (L37) — _export function writeGraph(dir: string, doc: GraphDocument): void { ensureDir(dir); fs.writeFileSync(graphPath(dir), JSO…_
- **function** `writeMeta` (L42) — _export function writeMeta(dir: string, meta: GraphMeta): void { ensureDir(dir); fs.writeFileSync(metaPath(dir), JSON.str…_
- **function** `writeReview` (L47) — _export function writeReview(dir: string, md: string): void { ensureDir(dir); fs.writeFileSync(reviewPath(dir), md, "utf8…_
- **function** `writeOverview` (L52) — _export function writeOverview(dir: string, md: string): void { ensureDir(dir); fs.writeFileSync(overviewPath(dir), md, "…_
- **imports:** `fs`, `path`, `./types`

### `src/graph/types.ts`
- **type** `GraphNodeKind` (L1) — _export type GraphNodeKind = | "file" | "function" | "class" | "interface" | "type" | "enum" | "variable" | "namespace";_
- **type** `GraphEdgeKind` (L11) — _export type GraphEdgeKind = | "imports" | "exports_to" | "contains" | "extends" | "implements" | "references_type";_
- **type** `GraphFileNode` (L19) — _export type GraphFileNode = { id: string; kind: "file"; path: string; };_
- **type** `GraphSymbolNode` (L25) — _export type GraphSymbolNode = { id: string; kind: Exclude<GraphNodeKind, "file">; name: string; file: string; line: numb…_
- **type** `GraphNode` (L35) — _export type GraphNode = GraphFileNode | GraphSymbolNode;_
- **type** `GraphEdge` (L37) — _export type GraphEdge = { from: string; to: string; kind: GraphEdgeKind; /** Original module specifier when kind is impo…_
- **type** `GraphDocument` (L45) — _export type GraphDocument = { version: 1; generatedAt: string; root: string; nodes: GraphNode[]; edges: GraphEdge[]; };_
- **type** `GraphMeta` (L53) — _export type GraphMeta = { version: 1; lastSyncAt?: string; files: Record< string, { hash: string; } >; };_
- **type** `LlmConfig` (L64) — _export type LlmConfig = { provider?: "openai"; model?: string; baseURL?: string; apiKey?: string; };_
- **type** `AiCodeGraphConfig` (L71) — _export type AiCodeGraphConfig = { /** Glob patterns, relative to project root */ include?: string[]; exclude?: string[];…_

### `src/index.ts`
_(no extracted symbols)_

### `src/llm/openaiCompatible.ts`
- **function** `chatCompletion` (L4) — _export async function chatCompletion( llm: ResolvedConfig["llm"], userMessage: string, system = "You are a senior engine…_
- **imports:** `axios`, `../config/loadConfig`

### `src/scanner/tsScanner.ts`
- **function** `hashContent` (L8) — _export function hashContent(s: string): string { return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }_
- **function** `symId` (L12) — _function symId(rel: string, name: string, line: number): string { return `sym:${toPosix(rel)}#L${line}:${name}`; }_
- **function** `resolveImportTarget` (L16) — _function resolveImportTarget(root: string, importerAbs: string, specifier: string): string | null { if (specifier.starts…_
- **function** `getName` (L34) — _function getName(node: ts.Node): string | null { if (ts.isModuleDeclaration(node)) { if (ts.isIdentifier(node.name)) ret…_
- **function** `lineOf` (L45) — _function lineOf(sf: ts.SourceFile, node: ts.Node): number { const pos = node.getStart(sf, false); return sf.getLineAndCh…_
- **function** `textPreview` (L50) — _function textPreview(sf: ts.SourceFile, node: ts.Node, max = 120): string | undefined { const t = node.getText(sf).repla…_
- **function** `scanTypeScriptFile` (L56) — _export function scanTypeScriptFile(absPath: string, content: string, root: string): { rel: string; nodes: GraphNode[]; e…_
- **function** `visit` (L90) — _visit = (node: ts.Node): void => { let symKind: GraphSymbolNode["kind"] | null = null; if (ts.isFunctionDeclaration(node…_
- **imports:** `fs`, `path`, `crypto`, `typescript`, `../graph/paths`, `../graph/types`

## Import map (file → file)

- `src/cli.ts` → `ext:commander` (commander)
- `src/cli.ts` → `ext:fs` (fs)
- `src/cli.ts` → `ext:path` (path)
- `src/cli.ts` → `src/config/loadConfig.ts` (./config/loadConfig)
- `src/cli.ts` → `src/commands/create.ts` (./commands/create)
- `src/cli.ts` → `src/commands/sync.ts` (./commands/sync)
- `src/cli.ts` → `src/commands/review.ts` (./commands/review)
- `src/commands/create.ts` → `ext:fs` (fs)
- `src/commands/create.ts` → `ext:fast-glob` (fast-glob)
- `src/commands/create.ts` → `src/config/loadConfig.ts` (../config/loadConfig)
- `src/commands/create.ts` → `src/graph/merge.ts` (../graph/merge)
- `src/commands/create.ts` → `src/graph/types.ts` (../graph/types)
- `src/commands/create.ts` → `src/graph/store.ts` (../graph/store)
- `src/commands/create.ts` → `src/graph/overview.ts` (../graph/overview)
- `src/commands/create.ts` → `src/scanner/tsScanner.ts` (../scanner/tsScanner)
- `src/commands/create.ts` → `src/graph/paths.ts` (../graph/paths)
- `src/commands/review.ts` → `ext:fs` (fs)
- `src/commands/review.ts` → `src/config/loadConfig.ts` (../config/loadConfig)
- `src/commands/review.ts` → `src/graph/store.ts` (../graph/store)
- `src/commands/review.ts` → `src/llm/openaiCompatible.ts` (../llm/openaiCompatible)
- `src/commands/sync.ts` → `ext:fs` (fs)
- `src/commands/sync.ts` → `ext:fast-glob` (fast-glob)
- `src/commands/sync.ts` → `src/config/loadConfig.ts` (../config/loadConfig)
- `src/commands/sync.ts` → `src/graph/merge.ts` (../graph/merge)
- `src/commands/sync.ts` → `src/graph/store.ts` (../graph/store)
- `src/commands/sync.ts` → `src/graph/overview.ts` (../graph/overview)
- `src/commands/sync.ts` → `src/scanner/tsScanner.ts` (../scanner/tsScanner)
- `src/commands/sync.ts` → `src/graph/paths.ts` (../graph/paths)
- `src/config/defineConfig.ts` → `src/graph/types.ts` (../graph/types)
- `src/config/loadConfig.ts` → `ext:fs` (fs)
- `src/config/loadConfig.ts` → `ext:path` (path)
- `src/config/loadConfig.ts` → `ext:jiti` (jiti)
- `src/config/loadConfig.ts` → `src/graph/types.ts` (../graph/types)
- `src/graph/merge.ts` → `src/graph/types.ts` (./types)
- `src/graph/overview.ts` → `src/graph/types.ts` (./types)
- `src/graph/paths.ts` → `ext:path` (path)
- `src/graph/store.ts` → `ext:fs` (fs)
- `src/graph/store.ts` → `ext:path` (path)
- `src/graph/store.ts` → `src/graph/types.ts` (./types)
- `src/llm/openaiCompatible.ts` → `ext:axios` (axios)
- `src/llm/openaiCompatible.ts` → `src/config/loadConfig.ts` (../config/loadConfig)
- `src/scanner/tsScanner.ts` → `ext:fs` (fs)
- `src/scanner/tsScanner.ts` → `ext:path` (path)
- `src/scanner/tsScanner.ts` → `ext:crypto` (crypto)
- `src/scanner/tsScanner.ts` → `ext:typescript` (typescript)
- `src/scanner/tsScanner.ts` → `src/graph/paths.ts` (../graph/paths)
- `src/scanner/tsScanner.ts` → `src/graph/types.ts` (../graph/types)