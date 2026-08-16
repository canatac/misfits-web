/**
 * Reminder generation & urgency computation for follow-up items.
 * Extracted from follow-up-detector.ts to keep it under LOC cap.
 */
import type { FollowUpItem, FollowUpReminder } from "@/types/follow-up";
import { genId } from "./heuristics";

/**
 * Generate reminders from follow-up items that are overdue or approaching
 * their due date.
 *
 * @param followUps - All tracked follow-up items.
 * @param now - Reference timestamp (defaults to current time).
 * @returns Array of reminders to surface.
 */
export function generateReminders(
  followUps: FollowUpItem[],
  now: Date = new Date()
): FollowUpReminder[] {
  const nowMs = now.getTime();
  const reminders: FollowUpReminder[] = [];

  for (const fu of followUps) {
    if (fu.status === "dismissed" || fu.status === "completed") continue;
    if (fu.status === "snoozed") {
      const snoozedMs = fu.snoozedUntil
        ? new Date(fu.snoozedUntil).getTime()
        : 0;
      if (snoozedMs > nowMs) continue; // still snoozed
    }

    const dueMs = new Date(fu.dueDate).getTime();
    const emailMs = new Date(fu.emailDate).getTime();
    const daysWaiting = Math.max(
      0,
      Math.floor((nowMs - emailMs) / (1000 * 60 * 60 * 24))
    );
    const daysOverdue = Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24));

    // Only remind if overdue or within 24h of due date.
    if (nowMs < dueMs - 24 * 3600_000) continue;

    let message: string;
    if (fu.type === "needs_reply") {
      if (daysOverdue > 0) {
        message = `You haven't replied to ${fu.senderName} in ${daysWaiting} day${daysWaiting === 1 ? "" : "s"}`;
      } else {
        message = `Reply to ${fu.senderName} today — "${fu.subject}"`;
      }
    } else if (fu.type === "promise") {
      if (daysOverdue >= 0) {
        message = `You promised to send "${fu.subject}" — it's overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;
      } else {
        message = `You promised to send "${fu.subject}" today`;
      }
    } else {
      // sent_awaiting
      message = `Still waiting for ${fu.senderName} to reply to "${fu.subject}" (${daysWaiting} day${daysWaiting === 1 ? "" : "s"})`;
    }

    const urgency: FollowUpReminder["urgency"] =
      daysOverdue >= 3 ? "urgent" : daysOverdue >= 1 ? "warning" : "info";

    reminders.push({
      id: genId(),
      followUpId: fu.id,
      emailId: fu.emailId,
      message,
      urgency,
      senderName: fu.senderName,
      subject: fu.subject,
      daysWaiting,
      createdAt: now.toISOString(),
    });
  }

  return reminders;
}

/**
 * Compute an urgency band for a follow-up item based on days overdue.
 */
export function getUrgency(
  fu: FollowUpItem,
  now: Date = new Date()
): "info" | "warning" | "urgent" {
  const daysOverdue = Math.floor(
    (now.getTime() - new Date(fu.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysOverdue >= 3) return "urgent";
  if (daysOverdue >= 1) return "warning";
  return "info";
}
