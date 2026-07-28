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

function genId(): string {
  return `filter-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Rule evaluation engine                                             */
/* ------------------------------------------------------------------ */

function getFieldValue(email: Email, field: FilterCondition["field"]): string {
  switch (field) {
    case "from":
      return `${email.from.name} <${email.from.address}>`.toLowerCase();
    case "to":
      return email.to.map((t) => `${t.name} <${t.address}>`).join(", ").toLowerCase();
    case "subject":
      return email.subject.toLowerCase();
    case "body":
      return email.body.toLowerCase();
    case "hasAttachment":
      return email.hasAttachments ? "true" : "false";
    case "size":
      return String(email.size);
    default:
      return "";
  }
}

function matchCondition(email: Email, cond: FilterCondition): boolean {
  const fieldValue = getFieldValue(email, cond.field);
  const target = cond.value.trim();

  switch (cond.operator) {
    case "contains":
      return fieldValue.includes(target.toLowerCase());
    case "equals":
      return fieldValue === target.toLowerCase();
    case "startsWith":
      return fieldValue.startsWith(target.toLowerCase());
    case "endsWith":
      return fieldValue.endsWith(target.toLowerCase());
    case "greaterThan": {
      const n = Number(target);
      return !Number.isNaN(n) && Number(fieldValue) > n;
    }
    case "lessThan": {
      const n = Number(target);
      return !Number.isNaN(n) && Number(fieldValue) < n;
    }
    case "matches": {
      try {
        return new RegExp(target, "i").test(fieldValue);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/** Returns true if every condition matches the email (AND logic). */
export function testRuleAgainstEmail(rule: Filter, email: Email): boolean {
  if (rule.conditions.length === 0) return false;
  return rule.conditions.every((c) => matchCondition(email, c));
}

/** Returns the list of emails that would match the given rule. */
export function testRule(rule: Filter, emails: Email[]): Email[] {
  return emails.filter((e) => testRuleAgainstEmail(rule, e));
}

/** Apply all enabled rules to a batch of emails (simulate). Returns the updated emails. */
export function applyRules(rules: Filter[], emails: Email[]): Email[] {
  const ordered = rules.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);
  return emails.map((email) => {
    let result = email;
    for (const rule of ordered) {
      if (testRuleAgainstEmail(rule, email)) {
        result = applyActions(result, rule.actions);
      }
    }
    return result;
  });
}

function applyActions(email: Email, actions: Filter["actions"]): Email {
  let next = email;
  for (const action of actions) {
    switch (action.type) {
      case "markRead":
        next = { ...next, isRead: true };
        break;
      case "archive":
        next = { ...next, folder: "archive" };
        break;
      case "delete":
        next = { ...next, folder: "trash" };
        break;
      case "star":
        next = { ...next, isStarred: true };
        break;
      case "label": {
        const labelId = action.params.labelId;
        if (labelId && !next.labels.includes(labelId)) {
          next = { ...next, labels: [...next.labels, labelId] };
        }
        break;
      }
      case "move": {
        const folder = action.params.folder as Email["folder"] | undefined;
        if (folder) next = { ...next, folder };
        break;
      }
      // forward is a side-effect; in the mock simulator we leave the email unchanged.
      case "forward":
        break;
      default:
        break;
    }
  }
  return next;
}

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
          (rules.length > 0 ? Math.max(...rules.map((r) => r.priority)) + 1 : 0);
        const rule: Filter = {
          id: genId(),
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
              : r,
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
            r.id === id ? { ...r, enabled: !r.enabled } : r,
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
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Display helpers for the filter editor UI                            */
/* ------------------------------------------------------------------ */

export const CONDITION_FIELD_LABELS: Record<FilterCondition["field"], string> = {
  from: "From",
  to: "To",
  subject: "Subject",
  body: "Body",
  hasAttachment: "Has attachment",
  size: "Size (bytes)",
};

export const CONDITION_OPERATOR_LABELS: Record<FilterCondition["operator"], string> = {
  contains: "contains",
  equals: "equals",
  startsWith: "starts with",
  endsWith: "ends with",
  greaterThan: "greater than",
  lessThan: "less than",
  matches: "matches regex",
};

export const ACTION_TYPE_LABELS: Record<Filter["actions"][number]["type"], string> = {
  markRead: "Mark as read",
  archive: "Archive",
  label: "Apply label",
  move: "Move to folder",
  forward: "Forward to",
  delete: "Delete",
  star: "Star",
};
