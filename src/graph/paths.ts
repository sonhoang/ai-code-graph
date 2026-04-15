import path from "path";

export function normalizeRelPath(root: string, absPath: string): string {
  const rel = path.relative(root, absPath);
  return rel.split(path.sep).join("/");
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
