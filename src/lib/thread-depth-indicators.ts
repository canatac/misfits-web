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

export interface ThreadMessage { id: string; parentId: string | null }

export interface DepthInfo { level: number; prefix: string; isDeep: boolean; ancestors: string[] }

const MAX_INDENT = 4;

function buildMap(messages: ThreadMessage[]): Map<string, ThreadMessage> {
  const map = new Map<string, ThreadMessage>();
  for (const m of messages) map.set(m.id, m);
  return map;
}

export function buildPrefix(level: number, isLast: boolean): string {
  if (level <= 0) return "";
  const lines = "\u2502 ".repeat(Math.max(0, level - 1));
  const branch = isLast ? "\u2514 " : "\u251C ";
  return `${lines}${branch}`;
}

export function computeDepth(message: ThreadMessage, messages: ThreadMessage[]): DepthInfo {
  const map = buildMap(messages);
  const ancestors: string[] = [];
  let level = 0;
  let current: ThreadMessage | undefined = message;
  while (current?.parentId) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    if (ancestors.includes(parent.id)) break;
    ancestors.push(parent.id);
    level++;
    current = parent;
  }
  return { level: Math.min(level, MAX_INDENT), prefix: buildPrefix(level, false), isDeep: level >= MAX_INDENT, ancestors };
}

export function computeAllDepths(messages: ThreadMessage[]): Record<string, DepthInfo> {
  const result: Record<string, DepthInfo> = {};
  const childrenByParent = new Map<string, string[]>();
  for (const m of messages) {
    const pid = m.parentId ?? "__root__";
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
    childrenByParent.get(pid)!.push(m.id);
  }
  for (const m of messages) {
    const info = computeDepth(m, messages);
    const pid = m.parentId ?? "__root__";
    const siblings = childrenByParent.get(pid) ?? [];
    const isLast = siblings[siblings.length - 1] === m.id;
    result[m.id] = { ...info, prefix: buildPrefix(info.level, isLast) };
  }
  return result;
}

export function depthClass(level: number): string { 
  return `thread-depth-${Math.min(level, MAX_INDENT)}`; 
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
