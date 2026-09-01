/**
 * ai-prompt-builders.ts — prompt/message builders extracted from ai-prompts.ts (Cycle 60).
 */
import type {
  AITone,
  AILength,
  AITranslationLang,
  AIComposerRequest,
  ChatMessage,
} from "@/types/ai";

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
export function lengthToTokens(length: AILength): number {
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildEmailMessages(req: AIComposerRequest): ChatMessage[] {
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

export function buildRewriteMessages(
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

export function buildTranslateMessages(
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

export function buildSubjectMessages(body: string, count: number): ChatMessage[] {
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

export function buildSmartCompleteMessages(textBefore: string): ChatMessage[] {
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
export function parseSubjects(content: string, count: number): string[] {
  return content
    .split("\n")
    .map((s) => s.replace(/^[\s•\-*\d.)\]]+/, "").trim())
    .filter((s) => s.length > 0)
    .slice(0, count);
}
