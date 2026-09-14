export type ExpandAllMode = "expand" | "collapse" | "toggle";

export function computeExpandAll(
  threadIds: string[],
  mode: ExpandAllMode,
  currentAllExpanded: boolean
): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  let target: boolean;
  if (mode === "expand") target = true;
  else if (mode === "collapse") target = false;
  else target = !currentAllExpanded;
  for (const id of threadIds) next[id] = target;
  return next;
}

export function allExpanded(state: Record<string, boolean>): boolean {
  const values = Object.values(state);
  if (values.length === 0) return false;
  return values.every(Boolean);
}

export function allCollapsed(state: Record<string, boolean>): boolean {
  const values = Object.values(state);
  if (values.length === 0) return false;
  return values.every((v) => !v);
}

export function toggleThread(state: Record<string, boolean>, threadId: string): Record<string, boolean> {
  return { ...state, [threadId]: !state[threadId] };
}

export function applyExpandAll(
  existing: Record<string, boolean>,
  threadIds: string[],
  mode: ExpandAllMode
): Record<string, boolean> {
  const currentAll = allExpanded(existing);
  const updated = computeExpandAll(threadIds, mode, currentAll);
  return { ...existing, ...updated };
}
