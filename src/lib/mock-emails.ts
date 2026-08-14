/**
 * Mock email data for development — realistic emails across folders,
 * senders, dates, flags, and attachments. Seeds extracted to
 * ./mock-emails-seeds.json (Sprint 7).
 */
import type {
  Email,
  EmailFolder,
  EmailLabel,
  EmailAttachment,
} from "@/types/email";
import seedsJson from "./mock-emails-seeds.json";

export const mockFolders: EmailFolder[] = [
  { id: "inbox", name: "Inbox", icon: "Inbox", unreadCount: 8, totalCount: 42 },
  { id: "sent", name: "Sent", icon: "Send", unreadCount: 0, totalCount: 18 },
  { id: "drafts", name: "Drafts", icon: "FileText", unreadCount: 0, totalCount: 3 },
  { id: "archive", name: "Archive", icon: "Archive", unreadCount: 0, totalCount: 127 },
  { id: "trash", name: "Trash", icon: "Trash2", unreadCount: 0, totalCount: 5 },
  { id: "spam", name: "Spam", icon: "AlertOctagon", unreadCount: 2, totalCount: 7 },
];

export const mockLabels: EmailLabel[] = [
  { id: "label-work", name: "Work", color: "#2563eb" },
  { id: "label-personal", name: "Personal", color: "#059669" },
  { id: "label-urgent", name: "Urgent", color: "#dc2626" },
  { id: "label-travel", name: "Travel", color: "#7c3aed" },
  { id: "label-newsletter", name: "Newsletter", color: "#6b7280" },
  { id: "label-family", name: "Family", color: "#f59e0b" },
];

function daysAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

type RawAttachment = Omit<EmailAttachment, "id">;
type EmailSeed = {
  from: { name: string; address: string };
  subject: string;
  preview: string;
  body: string;
  folder: Email["folder"];
  daysAgo: number;
  hoursAgo?: number;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  labels?: string[];
  attachments?: RawAttachment[];
  bodyType?: Email["bodyType"];
};

const seeds = seedsJson as EmailSeed[];

function makeAttachmentId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `att-${Math.random().toString(36).slice(2)}`;
}

function seedMessageId(i: number): string {
  return `<email-${String(i + 1).padStart(3, "0")}@misfits.ai>`;
}

const threadMap: Record<number, string> = {
  0: "thread-roadmap-q3",
  2: "thread-redis-valkey",
  5: "thread-lisbon-trip",
  7: "thread-design-review",
  12: "thread-api-outage",
  15: "thread-onboarding-fb",
  17: "thread-lisbon-trip",
  19: "thread-benefits",
  20: "thread-lunch",
  23: "thread-security-audit",
  25: "thread-rate-limiting",
  29: "thread-q2-retro",
  34: "thread-roadmap-q3",
  36: "thread-redis-valkey",
  38: "thread-lisbon-trip",
  40: "thread-security-audit",
  59: "thread-roadmap-q3",
  60: "thread-redis-valkey",
  61: "thread-lunch",
  62: "thread-lunch",
  63: "thread-lunch",
  64: "thread-design-review",
  65: "thread-onboarding-fb",
  66: "thread-rate-limiting",
  67: "thread-rate-limiting",
  68: "thread-api-outage",
  69: "thread-benefits",
  70: "thread-q2-retro",
};

const inReplyToMap: Record<number, number> = {
  2: 60, 20: 63, 34: 0, 36: 2, 38: 5, 40: 23,
  59: 34, 62: 61, 63: 62, 64: 7, 65: 15, 66: 25,
  67: 66, 68: 12, 69: 19, 70: 29,
};

const referencesMap: Record<number, number[]> = {
  2: [60], 20: [61, 62, 63], 34: [0], 36: [60, 2], 38: [5], 40: [23],
  59: [0, 34], 62: [61], 63: [61, 62], 64: [7], 65: [15], 66: [25],
  67: [25, 66], 68: [12], 69: [19], 70: [29],
};

export const mockEmails: Email[] = seeds.map((s, i) => {
  const date = daysAgo(s.daysAgo, s.hoursAgo ?? 0);
  const msgId = seedMessageId(i);
  const tid = threadMap[i] ?? `thread-${String(i + 1).padStart(3, "0")}`;
  const inReplyToSeed = inReplyToMap[i];
  const inReplyTo =
    inReplyToSeed !== undefined ? seedMessageId(inReplyToSeed) : undefined;
  const refSeeds = referencesMap[i];
  const references = refSeeds ? refSeeds.map(seedMessageId) : undefined;
  const attachments: EmailAttachment[] = (s.attachments ?? []).map((a) => ({
    ...a,
    id: makeAttachmentId(),
  }));
  return {
    id: `email-${String(i + 1).padStart(3, "0")}`,
    threadId: tid,
    folder: s.folder,
    from: s.from,
    to: [{ name: "me", address: "hermes@misfits.ai" }],
    subject: s.subject,
    preview: s.preview,
    body: s.body,
    bodyType: s.bodyType ?? "html",
    date,
    receivedAt: date,
    isRead: s.isRead ?? false,
    isStarred: s.isStarred ?? false,
    isImportant: s.isImportant ?? false,
    hasAttachments: attachments.length > 0,
    attachments,
    labels: s.labels ?? [],
    size: s.body.length + attachments.reduce((a, x) => a + x.size, 0),
    messageId: msgId,
    inReplyTo,
    references,
    headers: {},
    accountId: "acc-1",
  };
});

export function getMockEmailById(id: string): Email | undefined {
  return mockEmails.find((e) => e.id === id);
}

export function getMockEmailsByFolder(folder: string): Email[] {
  return mockEmails.filter((e) => e.folder === folder);
}
