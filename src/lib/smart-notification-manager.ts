/**
 * smart-notification-manager.ts — Smart notification engine for misfits.ai Mail.
 *
 * Filters push notifications based on email priority:
 * - Real people (contacts, known senders) → immediate notification
 * - Newsletters/automated → suppressed, batched into digest
 * - Unknown senders → gatekeeper pending (no notification until approved)
 *
 * Integrates with classification engine (issue #603) when available.
 */

import type { Email } from "@/types/email";

export type NotificationPolicy = "immediate" | "batched" | "suppressed" | "pending";

export interface NotificationRule {
  id: string;
  name: string;
  priority: number; // higher = evaluated first
  matches: (email: Email, context: NotificationContext) => boolean;
  action: NotificationPolicy;
}

export interface NotificationContext {
  isContact: boolean;
  isKnownSender: boolean;
  isNewsletter: boolean;
  isAutomated: boolean;
  hasUserRepliedTo: boolean;
  classification?: "priority" | "normal" | "low" | "spam" | "newsletter";
}

export interface NotificationResult {
  emailId: string;
  policy: NotificationPolicy;
  reason: string;
  ruleId?: string;
}

export interface DigestEntry {
  emailId: string;
  senderName: string;
  senderAddress: string;
  subject: string;
  receivedAt: string;
  folder: string;
}

export interface SmartNotificationManagerOptions {
  rules: NotificationRule[];
  digestFolder: string;
}

export const DEFAULT_RULES: NotificationRule[] = [
  {
    id: "rule-known-contact",
    name: "Known contacts always notify",
    priority: 100,
    matches: (email, ctx) => ctx.isContact || ctx.hasUserRepliedTo,
    action: "immediate",
  },
  {
    id: "rule-ai-spam",
    name: "AI-classified spam suppressed",
    priority: 90,
    matches: (_email, ctx) => ctx.classification === "spam",
    action: "suppressed",
  },
  {
    id: "rule-newsletter",
    name: "Newsletters batched to digest",
    priority: 80,
    matches: (email, ctx) => ctx.isNewsletter || ctx.classification === "newsletter",
    action: "batched",
  },
  {
    id: "rule-automated",
    name: "Automated notifications suppressed",
    priority: 70,
    matches: (_email, ctx) => ctx.isAutomated,
    action: "suppressed",
  },
  {
    id: "rule-unknown-sender",
    name: "Unknown senders pending gatekeeper",
    priority: 50,
    matches: (email, ctx) => !ctx.isKnownSender && !ctx.isContact,
    action: "pending",
  },
  {
    id: "rule-default",
    name: "Default: notify for known senders",
    priority: 10,
    matches: (email, ctx) => ctx.isKnownSender,
    action: "immediate",
  },
];

export class SmartNotificationManager {
  private rules: NotificationRule[];
  private digestEntries: DigestEntry[] = [];
  private suppressedCount = 0;
  private pendingSenders = new Set<string>();

  constructor(options?: Partial<SmartNotificationManagerOptions>) {
    this.rules = options?.rules ?? [...DEFAULT_RULES];
    // Sort by priority descending (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  evaluate(email: Email, context: NotificationContext): NotificationResult {
    for (const rule of this.rules) {
      if (rule.matches(email, context)) {
        const result: NotificationResult = {
          emailId: email.id,
          policy: rule.action,
          reason: rule.name,
          ruleId: rule.id,
        };
        this.trackResult(result, email);
        return result;
      }
    }
    return {
      emailId: email.id,
      policy: "batched",
      reason: "No matching rule — default to batched digest",
    };
  }

  private trackResult(result: NotificationResult, email: Email): void {
    if (result.policy === "batched") {
      this.digestEntries.push({
        emailId: email.id,
        senderName: email.from.name,
        senderAddress: email.from.address,
        subject: email.subject,
        receivedAt: email.date,
        folder: email.folder,
      });
    } else if (result.policy === "suppressed") {
      this.suppressedCount++;
    } else if (result.policy === "pending") {
      this.pendingSenders.add(email.from.address);
    }
  }

  getDigestEntries(): DigestEntry[] {
    return [...this.digestEntries];
  }

  getSuppressedCount(): number {
    return this.suppressedCount;
  }

  getPendingSenders(): string[] {
    return Array.from(this.pendingSenders);
  }

  clearDigest(): DigestEntry[] {
    const entries = [...this.digestEntries];
    this.digestEntries = [];
    return entries;
  }

  addRule(rule: NotificationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === ruleId);
    if (idx < 0) return false;
    this.rules.splice(idx, 1);
    return true;
  }

  getRules(): NotificationRule[] {
    return [...this.rules];
  }
}

export function createSmartNotificationManager(
  options?: Partial<SmartNotificationManagerOptions>,
): SmartNotificationManager {
  return new SmartNotificationManager(options);
}
