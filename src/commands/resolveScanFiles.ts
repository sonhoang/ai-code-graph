import fs from "fs";
import path from "path";
import fg from "fast-glob";
import type { ResolvedConfig } from "../config/loadConfig";

function isTs(abs: string): boolean {
  return /\.(ts|tsx|mts|cts)$/i.test(abs);
}

/**
 * Resolve absolute file paths to scan. When paths is empty, uses ["."].
 * Project root uses config.include; subdirectories use recursive ts globs.
 */
export async function resolveScanFiles(
  cwd: string,
  pathsIn: string[] | undefined,
  config: ResolvedConfig
): Promise<string[]> {
  const paths = pathsIn?.length ? pathsIn : ["."];
  const out = new Set<string>();

  for (const p of paths) {
    const abs = path.resolve(cwd, p);
    if (!fs.existsSync(abs)) continue;
    const st = fs.statSync(abs);
    if (st.isFile()) {
      if (isTs(abs)) out.add(abs);
      continue;
    }
    const rel = path.relative(cwd, abs);
    const isRoot = rel === "" || rel === ".";
    const files = isRoot
      ? await fg(config.include, { cwd, ignore: config.exclude, absolute: true, onlyFiles: true })
      : await fg(["**/*.{ts,tsx,mts,cts}"], {
          cwd: abs,
          ignore: config.exclude,
          absolute: true,
          onlyFiles: true
        });
    for (const f of files) {
      if (isTs(f)) out.add(f);
    }
  }

  return [...out].sort();
}
