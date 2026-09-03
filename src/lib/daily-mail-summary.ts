import { chatCompletionDirect } from "@/lib/ai-client";
import { calculatePriority } from "@/lib/ai-triage";
import type { ChatMessage } from "@/types/ai";
import type { Email } from "@/types/email";

export interface DailyMailPriorityLink {
  emailId: string;
  subject: string;
  from: string;
  reason: string;
  priorityScore: number;
}

export interface DailyMailSummary {
  pendingActions: string[];
  exchangedInfo: string[];
  priorityEmails: DailyMailPriorityLink[];
  generatedAt: string;
  source: "ai" | "rules";
}

const MAX_SOURCE_EMAILS = 30;
const MAX_PRIORITY_LINKS = 3;

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, 6);
}

function fallbackAction(email: Email): string {
  const score = calculatePriority(email);
  if (!email.isRead && score >= 70) {
    return `Répondre rapidement à « ${email.subject} » (${email.from.name || email.from.address}).`;
  }
  if (!email.isRead) {
    return `Lire « ${email.subject} » (${email.from.name || email.from.address}).`;
  }
  if (email.isStarred) {
    return `Planifier un suivi pour « ${email.subject} ».`;
  }
  return `Archiver ou classer « ${email.subject} ».`;
}

function buildFallbackSummary(emails: Email[]): DailyMailSummary {
  const sorted = emails
    .slice()
    .sort((a, b) => calculatePriority(b) - calculatePriority(a));

  const pending = sorted.filter((e) => !e.isRead || e.isStarred).slice(0, 4);
  const pendingActions =
    pending.length > 0
      ? pending.map(fallbackAction)
      : [
          "Aucune action urgente détectée sur les mails des dernières 24h.",
          "Vérifier rapidement l’inbox pour confirmer qu’aucune demande n’est bloquante.",
        ];

  const exchangedInfo = sorted.slice(0, 4).map((e) => {
    const sender = e.from.name || e.from.address;
    return `${sender}: ${e.subject}`;
  });

  const priorityEmails = sorted.slice(0, MAX_PRIORITY_LINKS).map((e) => ({
    emailId: e.id,
    subject: e.subject,
    from: e.from.name || e.from.address,
    reason: !e.isRead ? "Non lu avec signal élevé" : "Signal important à suivre",
    priorityScore: calculatePriority(e),
  }));

  return {
    pendingActions,
    exchangedInfo,
    priorityEmails,
    generatedAt: new Date().toISOString(),
    source: "rules",
  };
}

function normalizePriorityItems(
  value: unknown,
  emailsById: Map<string, Email>
): DailyMailPriorityLink[] {
  if (!Array.isArray(value)) return [];
  const out: DailyMailPriorityLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const emailId = typeof obj.emailId === "string" ? obj.emailId.trim() : "";
    if (!emailId) continue;
    const source = emailsById.get(emailId);
    if (!source) continue;
    const reason = typeof obj.reason === "string" && obj.reason.trim().length > 0
      ? obj.reason.trim()
      : "Prioritaire dans les 24h";
    const priorityScoreRaw = obj.priorityScore;
    const priorityScore =
      typeof priorityScoreRaw === "number" && Number.isFinite(priorityScoreRaw)
        ? Math.max(0, Math.min(100, Math.round(priorityScoreRaw)))
        : calculatePriority(source);

    out.push({
      emailId,
      subject: source.subject,
      from: source.from.name || source.from.address,
      reason,
      priorityScore,
    });
    if (out.length >= MAX_PRIORITY_LINKS) break;
  }
  return out;
}

function buildPrompt(emails: Email[]): ChatMessage[] {
  const compact = emails.slice(0, MAX_SOURCE_EMAILS).map((e) => ({
    id: e.id,
    from: e.from.name || e.from.address,
    subject: e.subject,
    preview: e.preview,
    isRead: e.isRead,
    isStarred: e.isStarred,
    isImportant: e.isImportant,
    date: e.date,
    priorityScore: calculatePriority(e),
  }));

  return [
    {
      role: "system",
      content:
        "Tu es un assistant de triage email. Réponds uniquement en JSON valide sans markdown.",
    },
    {
      role: "user",
      content: [
        "Résume les emails des 24 dernières heures.",
        "Objectif:",
        "1) actions en attente",
        "2) informations échangées",
        "3) liens vers les emails les plus prioritaires",
        "Format JSON strict:",
        '{"pendingActions":["..."],"exchangedInfo":["..."],"priorityEmails":[{"emailId":"...","reason":"...","priorityScore":0}]}',
        "Contraintes:",
        "- pendingActions: 2 à 5 points, actionnables",
        "- exchangedInfo: 2 à 5 points factuels",
        "- priorityEmails: max 3 items, emailId doit exister dans la liste fournie",
        "Emails:",
        JSON.stringify(compact),
      ].join("\n"),
    },
  ];
}

export async function summarizeDailyMail(emails: Email[]): Promise<DailyMailSummary> {
  if (emails.length === 0) {
    return {
      pendingActions: ["Aucun mail reçu sur les dernières 24h."],
      exchangedInfo: ["Pas de nouvel échange détecté sur cette période."],
      priorityEmails: [],
      generatedAt: new Date().toISOString(),
      source: "rules",
    };
  }

  const fallback = buildFallbackSummary(emails);
  const emailsById = new Map(emails.map((e) => [e.id, e]));

  try {
    const response = await chatCompletionDirect(buildPrompt(emails), {
      maxTokens: 700,
      temperature: 0.2,
    });
    const payload = extractJsonObject(response.content);
    if (!payload) return fallback;

    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const pendingActions = asTextArray(parsed.pendingActions);
    const exchangedInfo = asTextArray(parsed.exchangedInfo);
    const priorityEmails = normalizePriorityItems(parsed.priorityEmails, emailsById);

    return {
      pendingActions: pendingActions.length > 0 ? pendingActions : fallback.pendingActions,
      exchangedInfo: exchangedInfo.length > 0 ? exchangedInfo : fallback.exchangedInfo,
      priorityEmails: priorityEmails.length > 0 ? priorityEmails : fallback.priorityEmails,
      generatedAt: new Date().toISOString(),
      source: "ai",
    };
  } catch {
    return fallback;
  }
}

export function selectEmailsFromLast24h(emails: Email[], now = new Date()): Email[] {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  return emails.filter((email) => {
    const ts = new Date(email.receivedAt || email.date).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}
