/**
 * OpenRouter-compatible AI client for misfits.ai Mail.
 *
 * Provides low-level chat completions (streaming + non-streaming) and
 * high-level helpers used by the composer:
 *   - generateEmail      → draft an email from a natural-language prompt
 *   - rewriteText        → rewrite selected text in a different tone/length
 *   - translateText      → translate selected text
 *   - generateSubject    → suggest subject lines from the email body
 *   - smartComplete      → inline ghost-text autocomplete
 *
 * Security: the secret OPENROUTER_API_KEY is server-only. Browser calls are
 * transparently proxied through the `/api/ai` route handler so the key never
 * reaches the client. When `NEXT_PUBLIC_AI_API_KEY` is set, the browser may
 * call OpenRouter directly instead. The route handler (`src/app/api/ai/route.ts`)
 * imports the `*Direct` functions below to talk to OpenRouter server-side.
 */
import type {
  AIComposerRequest,
  AIResponse,
  AIStreamChunk,
  AITone,
  AILength,
  AITranslationLang,
  ChatMessage,
  CompletionOptions,
} from "@/types/ai";
import { resolveFeatureModel } from "@/lib/ai-settings";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_PROXY_URL = "/api/ai";
const REQUEST_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 60_000;

/**
 * Fast, inexpensive default model. Override via `NEXT_PUBLIC_AI_MODEL`
 * (client) or `AI_MODEL` (server). OpenRouter is OpenAI-compatible, so any
 * model it serves works here.
 */
export const AI_MODEL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_AI_MODEL || process.env.AI_MODEL)) ||
  "qwen/qwen3.7-flash";

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/** Error thrown by the AI client — carries an HTTP-style status + code. */
export class AIError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "AIError";
    this.status = status;
    this.code = code;
  }
}

/* ------------------------------------------------------------------ *
 * Configuration helpers
 * ------------------------------------------------------------------ */

/** Resolve the API key from the environment (server or public client var). */
export function getApiKey(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  return process.env.OPENROUTER_API_KEY ?? process.env.NEXT_PUBLIC_AI_API_KEY ?? null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * True when the current runtime can call OpenRouter directly with a usable
 * key. On the server this needs OPENROUTER_API_KEY; in the browser it needs
 * the public NEXT_PUBLIC_AI_API_KEY variant (the secret is never exposed).
 * Otherwise the browser proxies through `/api/ai`.
 */
function canCallDirectly(): boolean {
  if (!isBrowser()) return !!getApiKey();
  return !!process.env.NEXT_PUBLIC_AI_API_KEY;
}

/** Headers for a direct OpenRouter request (includes the bearer key). */
function buildDirectHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://misfits.ai",
    "X-Title": "misfits.ai Mail",
  };
  const key = getApiKey();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

/** Compose a timeout AbortSignal that also respects an external signal. */
function withTimeout(timeoutMs: number, external?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

/** Convert a non-OK response into a thrown AIError. */
async function toAIError(res: Response): Promise<never> {
  let message = res.statusText || "AI request failed";
  let code: string | undefined;
  try {
    const data = await res.json();
    message = data?.error?.message ?? data?.message ?? message;
    code = data?.error?.code ?? data?.code;
  } catch {
    // response had no JSON body — keep the status text
  }
  throw new AIError(res.status || 502, message, code);
}

/* ------------------------------------------------------------------ *
 * Low-level completion (direct OpenRouter calls — server-safe)
 * ------------------------------------------------------------------ */

/**
 * Non-streaming chat completion. Calls OpenRouter directly. Used by the
 * `/api/ai` route handler (server-side, with OPENROUTER_API_KEY) and by any
 * server-side caller. Returns the full assistant message.
 */
export async function chatCompletionDirect(
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): Promise<AIResponse> {
  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  const timeout = withTimeout(REQUEST_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildDirectHeaders(),
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new AIError(0, "AI request timed out.", "timeout");
    }
    throw new AIError(0, "Network error reaching the AI service.", "network");
  } finally {
    timeout.cleanup();
  }

  if (!res.ok) await toAIError(res);

  const data = await res.json();
  const choice = data?.choices?.[0];
  return {
    content: choice?.message?.content ?? "",
    role: "assistant",
    model: data?.model ?? model,
    usage: data?.usage,
    finishReason: choice?.finish_reason,
  };
}

/**
 * Streaming chat completion. Yields incremental content deltas as an async
 * generator. Calls OpenRouter directly and parses the Server-Sent-Events
 * stream. Used by the `/api/ai` route handler (server-side) and by any
 * server-side caller.
 */
export async function* streamChatCompletionDirect(
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): AsyncGenerator<AIStreamChunk> {
  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  const timeout = withTimeout(STREAM_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildDirectHeaders(),
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
  } catch (err) {
    timeout.cleanup();
    if ((err as Error).name === "AbortError") {
      throw new AIError(0, "AI stream timed out.", "timeout");
    }
    throw new AIError(0, "Network error reaching the AI service.", "network");
  }
  timeout.cleanup();

  if (!res.ok) await toAIError(res);
  const responseBody = res.body;
  if (!responseBody) throw new AIError(0, "AI stream returned no body.", "network");

  yield* parseSSEStream(responseBody);
}

/* ------------------------------------------------------------------ *
 * Transport-aware completion (used by hooks / store)
 * ------------------------------------------------------------------ */

/**
 * Non-streaming completion that picks the right transport: direct OpenRouter
 * when a key is available (server, or browser with a public key), otherwise
 * the secure `/api/ai` proxy. This is what the high-level helpers call.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): Promise<AIResponse> {
  if (canCallDirectly()) return chatCompletionDirect(messages, opts);

  // Browser → proxy. The proxy re-streams / returns JSON with the same shape.
  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const timeout = withTimeout(REQUEST_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature, maxTokens, model, stream: false }),
      signal: timeout.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new AIError(0, "AI request timed out.", "timeout");
    }
    throw new AIError(0, "Network error reaching the AI service.", "network");
  } finally {
    timeout.cleanup();
  }
  if (!res.ok) await toAIError(res);
  return (await res.json()) as AIResponse;
}

/**
 * Streaming completion that picks the right transport. When proxying through
 * `/api/ai`, the route handler re-emits the SSE stream, so the same parser is
 * reused on either path.
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions = {},
): AsyncGenerator<AIStreamChunk> {
  if (canCallDirectly()) {
    yield* streamChatCompletionDirect(messages, opts);
    return;
  }

  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const timeout = withTimeout(STREAM_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature, maxTokens, model, stream: true }),
      signal: timeout.signal,
    });
  } catch (err) {
    timeout.cleanup();
    if ((err as Error).name === "AbortError") {
      throw new AIError(0, "AI stream timed out.", "timeout");
    }
    throw new AIError(0, "Network error reaching the AI service.", "network");
  }
  timeout.cleanup();

  if (!res.ok) await toAIError(res);
  const proxyBody = res.body;
  if (!proxyBody) throw new AIError(0, "AI stream returned no body.", "network");
  yield* parseSSEStream(proxyBody);
}

/**
 * Parse a `text/event-stream` response body into content deltas.
 * OpenRouter emits `data: {json}\n\n` lines, terminated by `data: [DONE]`.
 */
async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AIStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last (possibly partial) line in the buffer.
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") {
          yield { content: "", done: true };
          return;
        }
        try {
          const json = JSON.parse(payload);
          if (json?.error) {
            throw new AIError(
              502,
              json.error.message ?? "AI stream error.",
              json.error.code,
            );
          }
          const delta = json?.choices?.[0]?.delta?.content ?? "";
          if (delta) yield { content: delta, done: false };
        } catch (err) {
          if (err instanceof AIError) throw err;
          // Skip malformed SSE chunks rather than aborting the whole stream.
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // already released
    }
  }
  yield { content: "", done: true };
}

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
  if (req.context?.subject) userParts.push(`Objet de l'email: ${req.context.subject}`);
  if (req.context?.recipients?.length) {
    userParts.push(`Destinataires: ${req.context.recipients.join(", ")}`);
  }
  if (req.context?.threadContext) {
    userParts.push(`Contexte de la conversation précédente:\n${req.context.threadContext}`);
  }
  const user = userParts.join("\n\n") || "Écris un email.";

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function buildRewriteMessages(
  text: string,
  opts: { tone?: AITone; length?: AILength },
): ChatMessage[] {
  const tone = opts.tone ? `Ton souhaité: ${TONE_DESCRIPTIONS[opts.tone]}.` : "";
  const length = opts.length ? `Longueur: ${LENGTH_DESCRIPTIONS[opts.length]}.` : "";
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
  target: AITranslationLang,
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
  opts: { stream: true; signal?: AbortSignal },
): AsyncGenerator<AIStreamChunk>;
export function generateEmail(
  req: AIComposerRequest,
  opts?: { stream?: false; signal?: AbortSignal },
): Promise<AIResponse>;
export function generateEmail(
  req: AIComposerRequest,
  opts: { stream?: boolean; signal?: AbortSignal } = {},
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
  opts: { tone?: AITone; length?: AILength; signal?: AbortSignal } = {},
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
  signal?: AbortSignal,
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
  opts: { count?: number; signal?: AbortSignal } = {},
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
export async function smartComplete(
  req: { textBefore: string; signal?: AbortSignal },
): Promise<AIResponse> {
  const messages = buildSmartCompleteMessages(req.textBefore);
  const model = await resolveFeatureModel("complete");
  return chatCompletion(messages, {
    signal: req.signal,
    maxTokens: 32,
    temperature: 0.4,
    model,
  });
}
