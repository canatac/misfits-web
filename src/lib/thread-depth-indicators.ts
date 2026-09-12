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
export function depthClass(level: number): string { return `thread-depth-${Math.min(level, MAX_INDENT)}`; }
