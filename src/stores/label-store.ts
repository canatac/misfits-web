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
import {
  buildNewLabel,
  collectDescendants,
  pruneAssignments,
  reorderSiblings,
} from "./parts/label-store/mutations";

export { LABEL_COLORS, LABEL_ICONS } from "./parts/label-store/presets";

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
        const label = buildNewLabel(input, get().labels);
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
        set((state) => {
          const toDelete = collectDescendants(state.labels, id);
          const labels = state.labels.filter((l) => !toDelete.has(l.id));
          const assignments = pruneAssignments(state.assignments, toDelete);
          return { labels, assignments };
        });
      },

      reorderLabel: (id, direction) => {
        set((state) => {
          const next = reorderSiblings(state.labels, id, direction);
          return next ? { labels: next } : state;
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
