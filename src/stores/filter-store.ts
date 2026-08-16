/**
 * Zustand store for filter/rule management.
 * CRUD + rule evaluation engine + JSON import/export, with localStorage persistence.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Filter,
  FilterCreateInput,
  FilterUpdateInput,
  FilterCondition,
} from "@/types/label";
import type { Email } from "@/types/email";
import {
  applyRules,
  genFilterId,
  testRule,
  testRuleAgainstEmail,
} from "@/stores/filter-rule-engine";

// Re-export the pure engine helpers so existing imports from
// `@/stores/filter-store` keep working.
export { applyRules, testRule, testRuleAgainstEmail };

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface FilterState {
  rules: Filter[];
  activeRuleId: string | null;

  // Queries
  getRuleById: (id: string) => Filter | undefined;
  testRule: (rule: Filter, emails: Email[]) => Email[];

  // Mutations
  createRule: (input: FilterCreateInput) => Filter;
  updateRule: (id: string, input: FilterUpdateInput) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  reorderRules: (orderedIds: string[]) => void;
  setActiveRule: (id: string | null) => void;

  // Import/export
  exportRules: () => string;
  importRules: (json: string) => number;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      rules: [],
      activeRuleId: null,

      getRuleById: (id) => get().rules.find((r) => r.id === id),

      testRule: (rule, emails) => testRule(rule, emails),

      createRule: (input) => {
        const now = new Date().toISOString();
        const rules = get().rules;
        const priority =
          input.priority ??
          (rules.length > 0
            ? Math.max(...rules.map((r) => r.priority)) + 1
            : 0);
        const rule: Filter = {
          id: genFilterId(),
          name: input.name.trim() || "Untitled rule",
          conditions: input.conditions ?? [],
          actions: input.actions ?? [],
          enabled: input.enabled ?? true,
          priority,
          createdAt: now,
        };
        set((state) => ({ rules: [...state.rules, rule] }));
        return rule;
      },

      updateRule: (id, input) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...input,
                  name: input.name !== undefined ? input.name.trim() : r.name,
                }
              : r
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
          activeRuleId: state.activeRuleId === id ? null : state.activeRuleId,
        }));
      },

      toggleRule: (id) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      reorderRules: (orderedIds) => {
        set((state) => ({
          rules: state.rules.map((r) => {
            const idx = orderedIds.indexOf(r.id);
            return idx >= 0 ? { ...r, priority: idx } : r;
          }),
        }));
      },

      setActiveRule: (id) => set({ activeRuleId: id }),

      exportRules: () => {
        return JSON.stringify(get().rules, null, 2);
      },

      importRules: (json) => {
        try {
          const parsed = JSON.parse(json) as Filter[];
          if (!Array.isArray(parsed)) return 0;
          const valid = parsed.filter((r) => r && typeof r.name === "string");
          set({ rules: valid });
          return valid.length;
        } catch {
          return 0;
        }
      },
    }),
    {
      name: "misfits-filters",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rules: state.rules }),
    }
  )
);

/* ------------------------------------------------------------------ */
/* Display helpers for the filter editor UI                            */
/* ------------------------------------------------------------------ */

export const CONDITION_FIELD_LABELS: Record<FilterCondition["field"], string> =
  {
    from: "From",
    to: "To",
    subject: "Subject",
    body: "Body",
    hasAttachment: "Has attachment",
    size: "Size (bytes)",
  };

export const CONDITION_OPERATOR_LABELS: Record<
  FilterCondition["operator"],
  string
> = {
  contains: "contains",
  equals: "equals",
  startsWith: "starts with",
  endsWith: "ends with",
  greaterThan: "greater than",
  lessThan: "less than",
  matches: "matches regex",
};

export const ACTION_TYPE_LABELS: Record<
  Filter["actions"][number]["type"],
  string
> = {
  markRead: "Mark as read",
  archive: "Archive",
  label: "Apply label",
  move: "Move to folder",
  forward: "Forward to",
  delete: "Delete",
  star: "Star",
};
