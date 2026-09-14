/**
 * Visual Thread Depth Indicators (Nested Lines)
 *
 * Renders depth lines/gutter indicators for email threads
 * to visually show conversation hierarchy.
 */

export interface ThreadNode {
  id: string;
  parentId: string | null;
  depth: number;
  children: ThreadNode[];
}

export function buildThreadTree(nodes: Array<{ id: string; parentId: string | null }>): ThreadNode[] {
  const nodeMap = new Map<string, ThreadNode>();
  const roots: ThreadNode[] = [];

  for (const n of nodes) {
    nodeMap.set(n.id, { id: n.id, parentId: n.parentId, depth: 0, children: [] });
  }

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const assignDepth = (nodes: ThreadNode[], depth: number) => {
    for (const node of nodes) {
      node.depth = depth;
      assignDepth(node.children, depth + 1);
    }
  };
  assignDepth(roots, 0);

  return roots;
}

export function getMaxDepth(nodes: ThreadNode[]): number {
  let max = 0;
  const traverse = (n: ThreadNode[]) => {
    for (const node of n) {
      max = Math.max(max, node.depth);
      traverse(node.children);
    }
  };
  traverse(nodes);
  return max;
}

export function flattenTree(nodes: ThreadNode[]): ThreadNode[] {
  const result: ThreadNode[] = [];
  const traverse = (n: ThreadNode[]) => {
    for (const node of n) {
      result.push(node);
      traverse(node.children);
    }
  };
  traverse(nodes);
  return result;
}

export function getDepthIndent(depth: number, indentSize = 20): string {
  return `${depth * indentSize}px`;
}

export function getConnectorLines(depth: number): string[] {
  return Array.from({ length: depth }, (_, i) => `M${i * 20 + 10} 0 V100`);
}
