/**
 * AI triage service — categorize, prioritize, summarize emails.
 * Rule-based fallback when AI unavailable.
 */
import type { Email } from "@/types/email";
import type {
  TriageResult,
  EmailCategory,
  PriorityScore,
  PriorityBand,
  TriageAction,
} from "@/types/ai-triage";
import { chatCompletionDirect } from "@/lib/ai-client";
import type { ChatMessage } from "@/types/ai";

function bandFromScore(score: number): PriorityBand {
  if (score >= 80) return "urgent";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

const NEWSLETTER_KEYWORDS = [
  "unsubscribe",
  "newsletter",
  "digest",
  "weekly",
  "monthly",
  "mailing",
];
const PROMO_KEYWORDS = [
  "sale",
  "discount",
  "offer",
  "deal",
  "promo",
  "coupon",
  "% off",
  "limited time",
];
const NOTIFICATION_KEYWORDS = [
  "noreply",
  "no-reply",
  "notification",
  "alert",
  "automated",
  "do not reply",
];
const SOCIAL_KEYWORDS = [
  "facebook",
  "twitter",
  "linkedin",
  "instagram",
  "follow",
  "like",
  "share",
];

export function categorizeEmail(email: Email): {
  category: EmailCategory;
  confidence: number;
} {
  const text =
    `${email.subject} ${email.preview} ${email.from.address}`.toLowerCase();

  if (NEWSLETTER_KEYWORDS.some((k) => text.includes(k)))
    return { category: "newsletter", confidence: 0.8 };
  if (PROMO_KEYWORDS.some((k) => text.includes(k)))
    return { category: "promo", confidence: 0.8 };
  if (NOTIFICATION_KEYWORDS.some((k) => text.includes(k)))
    return { category: "notification", confidence: 0.7 };
  if (SOCIAL_KEYWORDS.some((k) => text.includes(k)))
    return { category: "social", confidence: 0.7 };
  if (email.isImportant) return { category: "important", confidence: 0.9 };
  if (email.from.address.includes("@misfits.ai"))
    return { category: "work", confidence: 0.6 };
  return { category: "personal", confidence: 0.5 };
}

export function calculatePriority(email: Email): PriorityScore {
  let score = 30;
  if (email.isImportant) score += 30;
  if (!email.isRead) score += 15;
  if (email.isStarred) score += 10;
  if (email.hasAttachments) score += 5;
  const text = `${email.subject} ${email.preview}`.toLowerCase();
  if (/\b(urgent|asap|important|deadline|today)\b/.test(text)) score += 20;
  if (email.from.address.includes("@misfits.ai")) score += 10;
  return Math.min(100, Math.max(0, score));
}

export function suggestAction(
  email: Email,
  category: EmailCategory,
  priority: number
): TriageAction {
  if (priority >= 70) return "reply";
  if (category === "newsletter" || category === "promo") return "archive";
  if (category === "notification" && priority < 40) return "archive";
  if (email.isStarred) return "follow_up";
  return "archive";
}

export function detectUrgentReply(email: Email): boolean {
  const text = `${email.subject} ${email.preview}`.toLowerCase();
  return (
    /\?/.test(email.subject) ||
    /\b(please|need|can you|could you|would you)\b/.test(text)
  );
}

export async function summarizeEmail(email: Email): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: "Summarize this email in 1-2 sentences. Be concise.",
      },
      {
        role: "user",
        content: `Subject: ${email.subject}\nFrom: ${email.from.address}\n\n${email.preview}`,
      },
    ];
    const res = await chatCompletionDirect(messages, { maxTokens: 100 });
    return res.content;
  } catch {
    return email.preview.slice(0, 120) + "...";
  }
}

export async function triageEmail(email: Email): Promise<TriageResult> {
  const { category, confidence } = categorizeEmail(email);
  const priority = calculatePriority(email);
  const action = suggestAction(email, category, priority);
  const needsUrgentReply = detectUrgentReply(email) && priority >= 60;

  return {
    emailId: email.id,
    category,
    priority,
    band: bandFromScore(priority),
    action,
    needsUrgentReply,
    reasoning: `Rule-based: ${category} with priority ${priority}`,
    keywords: [],
    confidence,
    triagedAt: new Date().toISOString(),
    source: "rules",
  };
}

export async function triageBatch(emails: Email[]): Promise<TriageResult[]> {
  return Promise.all(emails.map(triageEmail));
}
