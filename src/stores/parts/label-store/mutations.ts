/**
 * Pure helpers for label mutations — extracted from label-store.ts.
 */
import type { Label, LabelCreateInput } from "@/types/label";

/** Generate a unique label id. */
export function genId(): string {
  return `label-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a new Label from a create input, given existing labels for ordering. */
export function buildNewLabel(
  input: LabelCreateInput,
  existing: Label[]
): Label {
  const now = new Date().toISOString();
  const siblings = existing.filter(
    (l) => (l.parentId ?? null) === (input.parentId ?? null)
  );
  const order =
    siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;
  return {
    id: genId(),
    name: input.name.trim(),
    color: input.color || "#3b5bff",
    icon: input.icon ?? "",
    parentId: input.parentId ?? null,
    description: input.description,
    order,
    createdAt: now,
  };
}

/** Collect a label id + all its descendants. */
export function collectDescendants(labels: Label[], rootId: string): Set<string> {
  const toDelete = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const l of labels) {
      if (l.parentId && toDelete.has(l.parentId) && !toDelete.has(l.id)) {
        toDelete.add(l.id);
        added = true;
      }
    }
  }
  return toDelete;
}

/** Filter assignments by removing any references to deleted label ids. */
export function pruneAssignments(
  assignments: Record<string, string[]>,
  deletedIds: Set<string>
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [emailId, labelIds] of Object.entries(assignments)) {
    const filtered = labelIds.filter((lid) => !deletedIds.has(lid));
    if (filtered.length > 0) out[emailId] = filtered;
  }
  return out;
}

/** Swap two sibling labels' orders for reordering. */
export function reorderSiblings(
  labels: Label[],
  id: string,
  direction: "up" | "down"
): Label[] | null {
  const label = labels.find((l) => l.id === id);
  if (!label) return null;
  const siblings = labels
    .filter((l) => (l.parentId ?? null) === (label.parentId ?? null))
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return null;
  const a = siblings[idx]!;
  const b = siblings[swapIdx]!;
  return labels.map((l) => {
    if (l.id === a.id) return { ...l, order: b.order };
    if (l.id === b.id) return { ...l, order: a.order };
    return l;
  });
}
