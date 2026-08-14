/**
 * ai-prompts.ts — high-level AI helpers extracted from ai-client (Sprint 12).
 */
import type {
  AITone,
  AILength,
  AITranslationLang,
  AIComposerRequest,
  AIResponse,
  AIStreamChunk,
  ChatMessage,
} from "@/types/ai";
import { resolveFeatureModel } from "@/lib/ai-settings";
import { AI_MODEL, chatCompletion, streamChatCompletion } from "@/lib/ai-client";

/* ------------------------------------------------------------------ *
 * Prompt builders
 * ------------------------------------------------------------------ */

const TONE_DESCRIPTIONS: Record<AITone, string> = {
  professionnel: "professionnel et courtois",
  amical: "amical et chaleureux",
  direct: "direct et concis",
  formel: "formel et soutenu",
  decontracte: "décontracté et naturel",
};

const LENGTH_DESCRIPTIONS: Record<AILength, string> = {
  concis: "concis (2 à 3 phrases)",
  standard: "standard (un court paragraphe)",
  detaille: "détaillé (2 à 3 paragraphes)",
};

const LANG_NAMES: Record<AITranslationLang, string> = {
  fr: "français",
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
};

/** Approximate max-tokens budget for a requested length. */
function lengthToTokens(length: AILength): number {
  switch (length) {
    case "concis":
      return 256;
    case "detaille":
      return 1024;
    case "standard":
    default:
      return 512;
  }
}

/** Strip HTML tags and collapse whitespace (used for subject generation). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEmailMessages(req: AIComposerRequest): ChatMessage[] {
  const langClause = req.language
    ? `Écris l'email en ${LANG_NAMES[req.language]}.`
    : "";
  const system = [
    "Tu es un assistant de rédaction d'emails pour misfits.ai Mail.",
    "Tu écris des emails clairs, utiles et bien structurés en HTML simple",
    "(balises <p>, <br>, <ul>, <li>, <strong> uniquement).",
    "Réponds UNIQUEMENT avec le corps de l'email, sans objet ni commentaire.",
    `Ton: ${TONE_DESCRIPTIONS[req.tone]}.`,
    `Longueur: ${LENGTH_DESCRIPTIONS[req.length]}.`,
    langClause,
  ]
    .filter(Boolean)
    .join(" ");

  const userParts: string[] = [];
  if (req.prompt) userParts.push(req.prompt);
  if (req.context?.subject)
    userParts.push(`Objet de l'email: ${req.context.subject}`);
  if (req.context?.recipients?.length) {
    userParts.push(`Destinataires: ${req.context.recipients.join(", ")}`);
  }
  if (req.context?.threadContext) {
    userParts.push(
      `Contexte de la conversation précédente:\n${req.context.threadContext}`
    );
  }
  const user = userParts.join("\n\n") || "Écris un email.";

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function buildRewriteMessages(
  text: string,
  opts: { tone?: AITone; length?: AILength }
): ChatMessage[] {
  const tone = opts.tone
    ? `Ton souhaité: ${TONE_DESCRIPTIONS[opts.tone]}.`
    : "";
  const length = opts.length
    ? `Longueur: ${LENGTH_DESCRIPTIONS[opts.length]}.`
    : "";
  const system = [
    "Réécris le texte fourni en conservant son sens et ses informations clés,",
    "en adaptant le ton et la longueur demandés.",
    "Réponds UNIQUEMENT avec le texte réécrit en HTML simple (<p>, <br>, <strong>).",
    tone,
    length,
  ]
    .filter(Boolean)
    .join(" ");
  return [
    { role: "system", content: system },
    { role: "user", content: text },
  ];
}

function buildTranslateMessages(
  text: string,
  target: AITranslationLang
): ChatMessage[] {
  const system = [
    `Traduis le texte fourni en ${LANG_NAMES[target]}.`,
    "Conserve le formatage HTML et le sens original.",
    "Réponds UNIQUEMENT avec la traduction, sans commentaire.",
  ].join(" ");
  return [
    { role: "system", content: system },
    { role: "user", content: text },
  ];
}

function buildSubjectMessages(body: string, count: number): ChatMessage[] {
  const system = [
    `Génère ${count} objets d'email courts et pertinents (60 caractères max chacun)`,
    "à partir du corps fourni.",
    "Réponds UNIQUEMENT avec les objets, un par ligne, sans numérotation ni guillemets.",
  ].join(" ");
  return [
    { role: "system", content: system },
    { role: "user", content: stripHtml(body).slice(0, 2000) },
  ];
}

function buildSmartCompleteMessages(textBefore: string): ChatMessage[] {
  const system = [
    "Tu es un moteur d'autocomplétion pour un client mail.",
    "Complète naturellement la phrase en cours à partir du texte fourni.",
    "Réponds UNIQUEMENT avec la suite du texte (15 mots maximum),",
    "sans répéter le texte déjà écrit, sans guillemets ni commentaires.",
  ].join(" ");
  return [
    { role: "system", content: system },
    { role: "user", content: textBefore.slice(-500) },
  ];
}

/** Parse a newline-separated model response into a clean list of subjects. */
function parseSubjects(content: string, count: number): string[] {
  return content
    .split("\n")
    .map((s) => s.replace(/^[\s•\-*\d.)\]]+/, "").trim())
    .filter((s) => s.length > 0)
    .slice(0, count);
}

/* ------------------------------------------------------------------ *
 * High-level helpers
 * ------------------------------------------------------------------ */

/** Overload set: streaming vs. non-streaming email generation. */
export function generateEmail(
  req: AIComposerRequest,
  opts: { stream: true; signal?: AbortSignal }
): AsyncGenerator<AIStreamChunk>;
export function generateEmail(
  req: AIComposerRequest,
  opts?: { stream?: false; signal?: AbortSignal }
): Promise<AIResponse>;
export function generateEmail(
  req: AIComposerRequest,
  opts: { stream?: boolean; signal?: AbortSignal } = {}
): Promise<AIResponse> | AsyncGenerator<AIStreamChunk> {
  const messages = buildEmailMessages(req);
  const maxTokens = lengthToTokens(req.length);
  if (opts.stream) {
    return (async function* () {
      const model = await resolveFeatureModel("compose");
      yield* streamChatCompletion(messages, {
        signal: opts.signal,
        maxTokens,
        model,
      });
    })();
  }
  return (async () => {
    const model = await resolveFeatureModel("compose");
    return chatCompletion(messages, {
      signal: opts.signal,
      maxTokens,
      model,
    });
  })();
}

/** Rewrite the given text in the requested tone / length. */
export async function rewriteText(
  text: string,
  opts: { tone?: AITone; length?: AILength; signal?: AbortSignal } = {}
): Promise<AIResponse> {
  const messages = buildRewriteMessages(text, opts);
  const maxTokens = opts.length ? lengthToTokens(opts.length) : 512;
  const model = await resolveFeatureModel("rewrite");
  return chatCompletion(messages, { signal: opts.signal, maxTokens, model });
}

/** Translate the given text into the target language. */
export async function translateText(
  text: string,
  target: AITranslationLang,
  signal?: AbortSignal
): Promise<AIResponse> {
  const messages = buildTranslateMessages(text, target);
  const model = await resolveFeatureModel("translate");
  return chatCompletion(messages, { signal, maxTokens: 1024, model });
}

/**
 * Generate subject-line suggestions from the email body.
 * Returns up to `count` subjects (default 3).
 */
export async function generateSubject(
  body: string,
  opts: { count?: number; signal?: AbortSignal } = {}
): Promise<string[]> {
  const count = Math.max(1, Math.min(5, opts.count ?? 3));
  const messages = buildSubjectMessages(body, count);
  const model = await resolveFeatureModel("subject");
  const res = await chatCompletion(messages, {
    signal: opts.signal,
    maxTokens: 128,
    temperature: 0.8,
    model,
  });
  const subjects = parseSubjects(res.content, count);
  // If the model returned fewer than requested, pad by reusing (rare).
  while (subjects.length < count && subjects.length > 0) {
    subjects.push(subjects[subjects.length - 1]);
  }
  return subjects.slice(0, count);
}

/**
 * Inline smart-completion: given the text typed so far, return a short
 * continuation to display as ghost text.
 */
export async function smartComplete(req: {
  textBefore: string;
  signal?: AbortSignal;
}): Promise<AIResponse> {
  const messages = buildSmartCompleteMessages(req.textBefore);
  const model = await resolveFeatureModel("complete");
  return chatCompletion(messages, {
    signal: req.signal,
    maxTokens: 32,
    temperature: 0.4,
    model,
  });
}
