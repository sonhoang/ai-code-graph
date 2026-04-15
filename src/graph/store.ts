import fs from "fs";
import path from "path";
import type { GraphDocument, GraphMeta } from "./types";

export function graphPath(dir: string): string {
  return path.join(dir, "graph.json");
}

export function metaPath(dir: string): string {
  return path.join(dir, "meta.json");
}

export function reviewPath(dir: string): string {
  return path.join(dir, "review.md");
}

export function overviewPath(dir: string): string {
  return path.join(dir, "overview.md");
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function readGraph(dir: string): GraphDocument | null {
  const p = graphPath(dir);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as GraphDocument;
}

export function readMeta(dir: string): GraphMeta {
  const p = metaPath(dir);
  if (!fs.existsSync(p)) return { version: 1, files: {} };
  return JSON.parse(fs.readFileSync(p, "utf8")) as GraphMeta;
}

export function writeGraph(dir: string, doc: GraphDocument): void {
  ensureDir(dir);
  fs.writeFileSync(graphPath(dir), JSON.stringify(doc, null, 2), "utf8");
}

export function writeMeta(dir: string, meta: GraphMeta): void {
  ensureDir(dir);
  fs.writeFileSync(metaPath(dir), JSON.stringify(meta, null, 2), "utf8");
}

export function writeReview(dir: string, md: string): void {
  ensureDir(dir);
  fs.writeFileSync(reviewPath(dir), md, "utf8");
}

export function writeOverview(dir: string, md: string): void {
  ensureDir(dir);
  fs.writeFileSync(overviewPath(dir), md, "utf8");
}
