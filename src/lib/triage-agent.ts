/**
 * Hermes AI Email Triage Agent (Issue #495).
 *
 * Natural language rules engine for email triage. Users define rules in plain
 * English ("Label invoices and move to Finance") which are parsed into structured
 * conditions and actions, then executed automatically on incoming emails.
 */

export type TriageAction = "label" | "archive" | "forward" | "draft" | "notify" | "delete" | "move" | "star" | "markRead";

export type TriageCondition = "from" | "to" | "subject" | "body" | "hasAttachment" | "isUnread" | "date" | "size";

export interface TriageRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: TriageConditionSet;
  actions: TriageActionSet;
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  lastExecuted?: string;
}

export interface TriageConditionSet {
  from?: string[];
  to?: string[];
  subjectContains?: string[];
  bodyContains?: string[];
  hasAttachment?: boolean;
  isUnread?: boolean;
  receivedAfter?: string;
  receivedBefore?: string;
  largerThan?: number;
  smallerThan?: number;
}

export interface TriageActionSet {
  labels?: string[];
  archive?: boolean;
  forwardTo?: string;
  draftReply?: boolean;
  notify?: boolean;
  delete?: boolean;
  moveTo?: string;
  star?: boolean;
  markRead?: boolean;
}

export interface TriageResult {
  ruleId: string;
  ruleName: string;
  emailId: string;
  matched: boolean;
  actionsApplied: TriageAction[];
  executedAt: string;
}

export interface TriageUndoEntry {
  resultId: string;
  ruleId: string;
  emailId: string;
  previousState: Partial<TriageActionSet>;
  undoneAt: string;
}

/**
 * Create a new triage rule.
 */
export function createTriageRule(options: {
  name: string;
  description: string;
  conditions: TriageConditionSet;
  actions: TriageActionSet;
  priority?: number;
}): TriageRule {
  const now = new Date().toISOString();
  return {
    id: `rule-${Date.now()}`,
    name: options.name,
    description: options.description,
    enabled: true,
    priority: options.priority || 0,
    conditions: options.conditions,
    actions: options.actions,
    createdAt: now,
    updatedAt: now,
    executionCount: 0,
  };
}

/**
 * Update an existing rule.
 */
export function updateTriageRule(
  rule: TriageRule,
  updates: Partial<Omit<TriageRule, "id" | "createdAt">>
): TriageRule {
  return {
    ...rule,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Enable a rule.
 */
export function enableRule(rule: TriageRule): TriageRule {
  return { ...rule, enabled: true, updatedAt: new Date().toISOString() };
}

/**
 * Disable a rule.
 */
export function disableRule(rule: TriageRule): TriageRule {
  return { ...rule, enabled: false, updatedAt: new Date().toISOString() };
}

/**
 * Delete a rule by ID.
 */
export function deleteRule(rules: TriageRule[], ruleId: string): TriageRule[] {
  return rules.filter((r) => r.id !== ruleId);
}

/**
 * Get enabled rules sorted by priority.
 */
export function getEnabledRules(rules: TriageRule[]): TriageRule[] {
  return rules
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Check if an email matches a rule's conditions.
 */
export function emailMatchesConditions(
  email: {
    from: { address: string; name: string };
    to: Array<{ address: string; name: string }>;
    subject: string;
    body: string;
    hasAttachments: boolean;
    isRead: boolean;
    date: string;
    size: number;
  },
  conditions: TriageConditionSet
): boolean {
  // Check from
  if (conditions.from && conditions.from.length > 0) {
    const fromMatch = conditions.from.some((f) =>
      email.from.address.toLowerCase().includes(f.toLowerCase()) ||
      email.from.name.toLowerCase().includes(f.toLowerCase())
    );
    if (!fromMatch) return false;
  }

  // Check subject
  if (conditions.subjectContains && conditions.subjectContains.length > 0) {
    const subjectMatch = conditions.subjectContains.some((s) =>
      email.subject.toLowerCase().includes(s.toLowerCase())
    );
    if (!subjectMatch) return false;
  }

  // Check body
  if (conditions.bodyContains && conditions.bodyContains.length > 0) {
    const bodyMatch = conditions.bodyContains.some((b) =>
      email.body.toLowerCase().includes(b.toLowerCase())
    );
    if (!bodyMatch) return false;
  }

  // Check attachment
  if (conditions.hasAttachment !== undefined) {
    if (email.hasAttachments !== conditions.hasAttachment) return false;
  }

  // Check read status
  if (conditions.isUnread !== undefined) {
    if (email.isRead !== !conditions.isUnread) return false;
  }

  // Check date range
  if (conditions.receivedAfter) {
    if (new Date(email.date) < new Date(conditions.receivedAfter)) return false;
  }
  if (conditions.receivedBefore) {
    if (new Date(email.date) > new Date(conditions.receivedBefore)) return false;
  }

  // Check size
  if (conditions.largerThan !== undefined) {
    if (email.size <= conditions.largerThan) return false;
  }
  if (conditions.smallerThan !== undefined) {
    if (email.size >= conditions.smallerThan) return false;
  }

  // Check to
  if (conditions.to && conditions.to.length > 0) {
    const toMatch = email.to.some((t) =>
      conditions.to!.some((c) =>
        t.address.toLowerCase().includes(c.toLowerCase()) ||
        t.name.toLowerCase().includes(c.toLowerCase())
      )
    );
    if (!toMatch) return false;
  }

  return true;
}

/**
 * Apply actions to an email.
 */
export function applyActions(
  rule: TriageRule,
  emailId: string
): TriageResult {
  const actionsApplied: TriageAction[] = [];
  const actions = rule.actions;

  if (actions.labels && actions.labels.length > 0) actionsApplied.push("label");
  if (actions.archive) actionsApplied.push("archive");
  if (actions.forwardTo) actionsApplied.push("forward");
  if (actions.draftReply) actionsApplied.push("draft");
  if (actions.notify) actionsApplied.push("notify");
  if (actions.delete) actionsApplied.push("delete");
  if (actions.moveTo) actionsApplied.push("move");
  if (actions.star) actionsApplied.push("star");
  if (actions.markRead) actionsApplied.push("markRead");

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    emailId,
    matched: true,
    actionsApplied,
    executedAt: new Date().toISOString(),
  };
}

/**
 * Execute all matching rules against an email.
 */
export function executeRules(
  rules: TriageRule[],
  email: {
    from: { address: string; name: string };
    to: Array<{ address: string; name: string }>;
    subject: string;
    body: string;
    hasAttachments: boolean;
    isRead: boolean;
    date: string;
    size: number;
  }
): TriageResult[] {
  const results: TriageResult[] = [];
  const enabledRules = getEnabledRules(rules);

  for (const rule of enabledRules) {
    if (emailMatchesConditions(email, rule.conditions)) {
      const result = applyActions(rule, `email-${Date.now()}`);
      results.push(result);
    }
  }

  return results;
}

/**
 * Create an undo entry for a triage result.
 */
export function createUndoEntry(
  result: TriageResult,
  previousState: Partial<TriageActionSet>
): TriageUndoEntry {
  return {
    resultId: `${result.ruleId}-${result.emailId}`,
    ruleId: result.ruleId,
    emailId: result.emailId,
    previousState,
    undoneAt: new Date().toISOString(),
  };
}

/**
 * Get rule execution statistics.
 */
export function getRuleStats(rule: TriageRule): {
  executionCount: number;
  lastExecuted: string | undefined;
  enabled: boolean;
} {
  return {
    executionCount: rule.executionCount,
    lastExecuted: rule.lastExecuted,
    enabled: rule.enabled,
  };
}

/**
 * Get action label for display.
 */
export function getActionLabel(action: TriageAction): string {
  const labels: Record<TriageAction, string> = {
    label: "Apply label",
    archive: "Archive",
    forward: "Forward",
    draft: "Draft reply",
    notify: "Notify",
    delete: "Delete",
    move: "Move to folder",
    star: "Star",
    markRead: "Mark as read",
  };
  return labels[action];
}

/**
 * Get condition label for display.
 */
export function getConditionLabel(condition: TriageCondition): string {
  const labels: Record<TriageCondition, string> = {
    from: "From",
    to: "To",
    subject: "Subject contains",
    body: "Body contains",
    hasAttachment: "Has attachment",
    isUnread: "Is unread",
    date: "Received date",
    size: "Size",
  };
  return labels[condition];
}

/**
 * Parse natural language rule into structured conditions/actions (simplified).
 */
export function parseNaturalLanguageRule(text: string): {
  conditions: TriageConditionSet;
  actions: TriageActionSet;
} {
  const lower = text.toLowerCase();
  const conditions: TriageConditionSet = {};
  const actions: TriageActionSet = {};

  // Detect conditions
  if (lower.includes("invoice") || lower.includes("facture")) {
    conditions.subjectContains = ["invoice", "facture", "payment"];
  }
  if (lower.includes("newsletter") || lower.includes("newsletter")) {
    conditions.subjectContains = conditions.subjectContains || [];
    conditions.subjectContains.push("newsletter", "unsubscribe");
  }
  if (lower.includes("unread")) {
    conditions.isUnread = true;
  }
  if (lower.includes("attachment") || lower.includes("pièce jointe")) {
    conditions.hasAttachment = true;
  }

  // Detect actions
  if (lower.includes("label") || lower.includes("labeller")) {
    const labelMatch = text.match(/label\s+(\w+)/i);
    actions.labels = labelMatch ? [labelMatch[1]] : ["processed"];
  }
  if (lower.includes("archive")) {
    actions.archive = true;
  }
  if (lower.includes("delete") || lower.includes("supprimer")) {
    actions.delete = true;
  }
  if (lower.includes("notify") || lower.includes("notifier")) {
    actions.notify = true;
  }
  if (lower.includes("star")) {
    actions.star = true;
  }
  if (lower.includes("mark as read")) {
    actions.markRead = true;
  }

  return { conditions, actions };
}
