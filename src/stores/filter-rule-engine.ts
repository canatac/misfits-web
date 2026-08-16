/**
 * Pure functions implementing the filter/rule evaluation engine.
 * Extracted from `filter-store.ts` to keep the Zustand store lean and to
 * let non-store code (previews, tests) reuse the same logic without pulling
 * in the persistence middleware.
 */
import type { Filter, FilterCondition } from "@/types/label";
import type { Email } from "@/types/email";

export function genFilterId(): string {
  return `filter-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFieldValue(email: Email, field: FilterCondition["field"]): string {
  switch (field) {
    case "from":
      return `${email.from.name} <${email.from.address}>`.toLowerCase();
    case "to":
      return email.to
        .map((t) => `${t.name} <${t.address}>`)
        .join(", ")
        .toLowerCase();
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

/** Apply all enabled rules to a batch of emails (simulate). Returns the updated emails. */
export function applyRules(rules: Filter[], emails: Email[]): Email[] {
  const ordered = rules
    .filter((r) => r.enabled)
    .sort((a, b) => a.priority - b.priority);
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
