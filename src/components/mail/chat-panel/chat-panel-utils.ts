"use client";

// chat-panel-utils.ts — extracted Sprint 4
// Pure constants and helpers for ChatPanel

export type Analytics = {
  sent: number;
  redactions: number;
  stops: number;
  regenerations: number;
  inserts: number;
  feedbackUp: number;
  feedbackDown: number;
  backendTaskRuns: number;
};

export type PersonaPreset = {
  tone: "neutre" | "court" | "professionnel" | "empathique";
  length: "court" | "moyen" | "détaillé";
  language: "fr" | "en";
};


export const QUICK_PROMPTS = [
  "Quels emails importants aujourd'hui ?",
  "Résume ce thread",
  "Trouve les emails sur le budget Q4",
];

export const QUICK_ACTIONS = [
  {
    id: "summarize",
    label: "Résumer",
    prompt:
      "Résume cet échange en 5 puces maximum (FR), puis donne niveau d'urgence (faible/moyen/élevé).",
  },
  {
    id: "reply",
    label: "Proposer réponse",
    prompt:
      "Propose une réponse email professionnelle en français: objet suggéré + corps prêt à envoyer.",
  },
  {
    id: "translate",
    label: "Traduire",
    prompt:
      "Traduis le contenu en français clair en gardant le sens exact. Si déjà en français, fournis une version plus concise.",
  },
  {
    id: "todo",
    label: "Extraire TODO",
    prompt:
      "Extrais les TODO/action items: owner suggéré, échéance si détectée, et priorité.",
  },
] as const;

export const ROLE_TEMPLATES = [
  {
    id: "sales",
    label: "Sales",
    prompt:
      "Contexte métier: Sales. Priorise impact business, next-step clair et CTA en fin de mail.",
  },
  {
    id: "support",
    label: "Support",
    prompt:
      "Contexte métier: Support client. Réponse empathique, structurée, orientée résolution.",
  },
  {
    id: "legal",
    label: "Legal",
    prompt:
      "Contexte métier: Legal. Réponse prudente, factuelle, sans engagement non validé.",
  },
  {
    id: "exec",
    label: "Exec",
    prompt:
      "Contexte métier: Executive. Résumé ultra-court, décision à prendre, risques/impacts.",
  },
] as const;

export const SENSITIVE_KEYWORDS = [
  "deploy",
  "rollback",
  "delete",
  "supprime",
  "production",
  "drop",
  "secret",
  "rotate key",
];

export const DEFAULT_PERSONA: PersonaPreset = {
  tone: "professionnel",
  length: "court",
  language: "fr",
};

export const DEFAULT_ANALYTICS: Analytics = {
  sent: 0,
  redactions: 0,
  stops: 0,
  regenerations: 0,
  inserts: 0,
  feedbackUp: 0,
  feedbackDown: 0,
  backendTaskRuns: 0,
};

export function containsSensitiveIntent(value: string): boolean {
  const lower = value.toLowerCase();
  return SENSITIVE_KEYWORDS.some((k) => lower.includes(k));
}

export function parseTaskCandidates(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => /^(-|\*|\d+\.)\s+/.test(line) || /TODO|action/i.test(line)
    )
    .map((line) => line.replace(/^(-|\*|\d+\.)\s+/, ""))
    .slice(0, 8);
}

export function redactPii(input: string): { sanitized: string; count: number } {
  let count = 0;
  const apply = (value: string, pattern: RegExp, replacement: string) =>
    value.replace(pattern, () => {
      count += 1;
      return replacement;
    });

  let out = input;
  out = apply(
    out,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]"
  );
  out = apply(
    out,
    /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}\b/g,
    "[REDACTED_PHONE]"
  );
  out = apply(out, /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi, "[REDACTED_IBAN]");
  out = apply(out, /\b(?:sk|ghp|ops)_[A-Za-z0-9]{10,}\b/g, "[REDACTED_TOKEN]");

  return { sanitized: out, count };
}

export function buildPersonaInstruction(preset: PersonaPreset): string {
  return [
    `Réponds en ${preset.language === "fr" ? "français" : "anglais"}.`,
    `Ton attendu: ${preset.tone}.`,
    `Longueur: ${preset.length}.`,
  ].join(" ");
}

interface ChatPanelProps {
  layout?: "overlay" | "docked";
  className?: string;
  onRequestClose?: () => void;
}

