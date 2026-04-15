import type { GraphDocument, GraphEdge, GraphNode } from "./types";

function collectIdsToRemove(relFile: string, nodes: GraphNode[]): Set<string> {
  const drop = new Set<string>();
  const posix = relFile.replace(/\\/g, "/");
  for (const n of nodes) {
    if (n.kind === "file") {
      if (n.path.replace(/\\/g, "/") === posix) drop.add(n.id);
    } else if (n.file.replace(/\\/g, "/") === posix) {
      drop.add(n.id);
    }
  }
  return drop;
}

/** Remove all nodes/edges belonging to a single source file, then append replacements. */
export function replaceFileInGraph(
  doc: GraphDocument,
  relFile: string,
  nextNodes: GraphNode[],
  nextEdges: GraphEdge[]
): GraphDocument {
  const remove = collectIdsToRemove(relFile, doc.nodes);
  const nodes = doc.nodes.filter(n => !remove.has(n.id)).concat(nextNodes);
  const edges = doc.edges.filter(e => !remove.has(e.from) && !remove.has(e.to)).concat(nextEdges);
  return { ...doc, nodes, edges };
}

export function stripDeletedFiles(doc: GraphDocument, deletedRelFiles: string[]): GraphDocument {
  let out = doc;
  for (const f of deletedRelFiles) {
    const remove = collectIdsToRemove(f, out.nodes);
    out = {
      ...out,
      nodes: out.nodes.filter(n => !remove.has(n.id)),
      edges: out.edges.filter(e => !remove.has(e.from) && !remove.has(e.to))
    };
  }
  return out;
}

export function emptyGraph(root: string): GraphDocument {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    root,
    nodes: [],
    edges: []
  };
}
