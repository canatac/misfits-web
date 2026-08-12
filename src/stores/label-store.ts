/**
 * Zustand store for label management.
 * CRUD + hierarchical label tree with localStorage persistence.
 * Also exposes label assignment helpers for emails (mirrored into the email store).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Label,
  LabelCreateInput,
  LabelUpdateInput,
  LabelTree,
} from "@/types/label";
import type { EmailLabel } from "@/types/email";
import { mockLabels } from "@/lib/mock-emails";

/** Generate a unique label id. */
function genId(): string {
  return `label-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seed labels derived from the mock labels on first load. */
function seedLabels(): Label[] {
  const now = new Date().toISOString();
  return mockLabels.map((l: EmailLabel, i) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    icon: "",
    parentId: null,
    description: undefined,
    order: i,
    createdAt: now,
  }));
}

interface LabelState {
  labels: Label[];
  /** emailId -> labelId[] assignments (persisted). */
  assignments: Record<string, string[]>;

  // Queries
  getLabelById: (id: string) => Label | undefined;
  getLabelTree: () => LabelTree[];
  getLabelsForEmail: (emailId: string) => Label[];

  // Mutations
  createLabel: (input: LabelCreateInput) => Label;
  updateLabel: (id: string, input: LabelUpdateInput) => void;
  deleteLabel: (id: string) => void;
  reorderLabel: (id: string, direction: "up" | "down") => void;
  assignLabelToEmail: (emailId: string, labelId: string) => void;
  removeLabelFromEmail: (emailId: string, labelId: string) => void;
  /** Replace all labels (used by import/sync). */
  setLabels: (labels: Label[]) => void;
}

/** Build a tree from a flat label list. Pure — safe to call from useMemo. */
export function buildLabelTree(labels: Label[]): LabelTree[] {
  const byParent = new Map<string | null, Label[]>();
  for (const l of labels) {
    const key = l.parentId ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(l);
    byParent.set(key, arr);
  }

  function attach(parent: Label | null): LabelTree[] {
    const key = parent ? parent.id : null;
    const children = (byParent.get(key) ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ ...l, children: attach(l) }));
    return children;
  }

  return attach(null);
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      labels: seedLabels(),
      assignments: {},

      getLabelById: (id) => get().labels.find((l) => l.id === id),

      getLabelTree: () => buildLabelTree(get().labels),

      getLabelsForEmail: (emailId) => {
        const { labels, assignments } = get();
        const ids = assignments[emailId] ?? [];
        return ids
          .map((id) => labels.find((l) => l.id === id))
          .filter((l): l is Label => !!l);
      },

      createLabel: (input) => {
        const now = new Date().toISOString();
        const siblings = get().labels.filter(
          (l) => (l.parentId ?? null) === (input.parentId ?? null)
        );
        const order =
          siblings.length > 0
            ? Math.max(...siblings.map((s) => s.order)) + 1
            : 0;
        const label: Label = {
          id: genId(),
          name: input.name.trim(),
          color: input.color || "#3b5bff",
          icon: input.icon ?? "",
          parentId: input.parentId ?? null,
          description: input.description,
          order,
          createdAt: now,
        };
        set((state) => ({ labels: [...state.labels, label] }));
        return label;
      },

      updateLabel: (id, input) => {
        set((state) => ({
          labels: state.labels.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...input,
                  name: input.name !== undefined ? input.name.trim() : l.name,
                }
              : l
          ),
        }));
      },

      deleteLabel: (id) => {
        // Also remove descendant labels and clear assignments referencing them.
        set((state) => {
          const toDelete = new Set<string>([id]);
          let added = true;
          while (added) {
            added = false;
            for (const l of state.labels) {
              if (
                l.parentId &&
                toDelete.has(l.parentId) &&
                !toDelete.has(l.id)
              ) {
                toDelete.add(l.id);
                added = true;
              }
            }
          }
          const labels = state.labels.filter((l) => !toDelete.has(l.id));
          const assignments: Record<string, string[]> = {};
          for (const [emailId, labelIds] of Object.entries(state.assignments)) {
            const filtered = labelIds.filter((lid) => !toDelete.has(lid));
            if (filtered.length > 0) assignments[emailId] = filtered;
          }
          return { labels, assignments };
        });
      },

      reorderLabel: (id, direction) => {
        set((state) => {
          const label = state.labels.find((l) => l.id === id);
          if (!label) return state;
          const siblings = state.labels
            .filter((l) => (l.parentId ?? null) === (label.parentId ?? null))
            .sort((a, b) => a.order - b.order);
          const idx = siblings.findIndex((l) => l.id === id);
          if (idx < 0) return state;
          const swapIdx = direction === "up" ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= siblings.length) return state;
          const a = siblings[idx];
          const b = siblings[swapIdx];
          const labels = state.labels.map((l) => {
            if (l.id === a.id) return { ...l, order: b.order };
            if (l.id === b.id) return { ...l, order: a.order };
            return l;
          });
          return { labels };
        });
      },

      assignLabelToEmail: (emailId, labelId) => {
        set((state) => {
          const current = state.assignments[emailId] ?? [];
          if (current.includes(labelId)) return state;
          return {
            assignments: {
              ...state.assignments,
              [emailId]: [...current, labelId],
            },
          };
        });
      },

      removeLabelFromEmail: (emailId, labelId) => {
        set((state) => {
          const current = state.assignments[emailId] ?? [];
          const next = current.filter((id) => id !== labelId);
          const assignments = { ...state.assignments };
          if (next.length > 0) {
            assignments[emailId] = next;
          } else {
            delete assignments[emailId];
          }
          return { assignments };
        });
      },

      setLabels: (labels) => set({ labels }),
    }),
    {
      name: "misfits-labels",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        labels: state.labels,
        assignments: state.assignments,
      }),
    }
  )
);

/* ------------------------------------------------------------------ */
/* Preset colors & icons for the label manager UI                      */
/* ------------------------------------------------------------------ */

export const LABEL_COLORS: string[] = [
  "#3b5bff",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#a1a1aa",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#6366f1",
];

export const LABEL_ICONS: string[] = [
  "briefcase",
  "user",
  "dollar-sign",
  "plane",
  "newspaper",
  "alert-circle",
  "star",
  "heart",
  "bookmark",
  "flag",
  "gift",
  "calendar",
];
