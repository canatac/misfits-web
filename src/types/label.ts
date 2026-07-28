/**
 * Label, Filter/Rule, and Snooze domain types for misfits.ai Mail.
 * Issue #146 — labels, filters & organization.
 */

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export interface Label {
  id: string;
  name: string;
  /** Hex color string, e.g. "#3b5bff". */
  color: string;
  /** Lucide icon name (kebab-case), e.g. "briefcase". Empty = no icon. */
  icon: string;
  /** Parent label id for hierarchical labels. null/undefined = top-level. */
  parentId: string | null;
  /** Optional human description shown in the label manager. */
  description?: string;
  /** Sort order within the parent. */
  order: number;
  /** When the label was created. */
  createdAt: string;
}

export interface LabelCreateInput {
  name: string;
  color: string;
  icon?: string;
  parentId?: string | null;
  description?: string;
}

export interface LabelUpdateInput {
  name?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  description?: string;
}

/** A label augmented with its direct children, forming a tree. */
export interface LabelTree extends Label {
  children: LabelTree[];
}

/* ------------------------------------------------------------------ */
/* Filters / Rules                                                     */
/* ------------------------------------------------------------------ */

export type ConditionField =
  | "from"
  | "to"
  | "subject"
  | "body"
  | "hasAttachment"
  | "size";

export type ConditionOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "matches";

export type ActionType =
  | "markRead"
  | "archive"
  | "label"
  | "move"
  | "forward"
  | "delete"
  | "star";

export interface FilterCondition {
  field: ConditionField;
  operator: ConditionOperator;
  /** String value; numeric for size, boolean for hasAttachment. */
  value: string;
}

export interface FilterAction {
  type: ActionType;
  /** Action parameters, e.g. { labelId: "..." } or { folder: "archive" } or { address: "..." }. */
  params: Record<string, string>;
}

export interface Filter {
  id: string;
  name: string;
  /** All conditions must match (AND). */
  conditions: FilterCondition[];
  /** Actions applied in order when conditions match. */
  actions: FilterAction[];
  enabled: boolean;
  /** Lower priority runs first. */
  priority: number;
  createdAt: string;
}

export interface FilterCreateInput {
  name: string;
  conditions?: FilterCondition[];
  actions?: FilterAction[];
  enabled?: boolean;
  priority?: number;
}

export interface FilterUpdateInput {
  name?: string;
  conditions?: FilterCondition[];
  actions?: FilterAction[];
  enabled?: boolean;
  priority?: number;
}

/* ------------------------------------------------------------------ */
/* Snooze                                                              */
/* ------------------------------------------------------------------ */

export interface SnoozedEmail {
  emailId: string;
  /** ISO timestamp when the email should resurface. */
  snoozedUntil: string;
  /** Optional reminder note shown when the snooze is due. */
  reminder?: string;
  /** ISO timestamp of when the snooze was set. */
  snoozedAt: string;
}

export interface SnoozePreset {
  id: string;
  label: string;
  /** Returns the absolute ISO timestamp for the preset, computed from now. */
  getUntil: () => string;
}

export interface DefaultReminders {
  /** Whether to enable reminders by default when snoozing. */
  enabled: boolean;
  /** Minutes before `snoozedUntil` to fire a reminder. */
  leadMinutes: number;
}
