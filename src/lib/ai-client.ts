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
  return (
    process.env.OPENROUTER_API_KEY ?? process.env.NEXT_PUBLIC_AI_API_KEY ?? null
  );
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
    else
      external.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
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
  opts: CompletionOptions = {}
): Promise<AIResponse> {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    signal,
    model = AI_MODEL,
  } = opts;
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
  opts: CompletionOptions = {}
): AsyncGenerator<AIStreamChunk> {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    signal,
    model = AI_MODEL,
  } = opts;
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
  if (!responseBody)
    throw new AIError(0, "AI stream returned no body.", "network");

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
  opts: CompletionOptions = {}
): Promise<AIResponse> {
  if (canCallDirectly()) return chatCompletionDirect(messages, opts);

  // Browser → proxy. The proxy re-streams / returns JSON with the same shape.
  const {
    temperature = 0.7,
    maxTokens = 1024,
    signal,
    model = AI_MODEL,
  } = opts;
  const timeout = withTimeout(REQUEST_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature,
        maxTokens,
        model,
        stream: false,
      }),
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
  opts: CompletionOptions = {}
): AsyncGenerator<AIStreamChunk> {
  if (canCallDirectly()) {
    yield* streamChatCompletionDirect(messages, opts);
    return;
  }

  const {
    temperature = 0.7,
    maxTokens = 1024,
    signal,
    model = AI_MODEL,
  } = opts;
  const timeout = withTimeout(STREAM_TIMEOUT_MS, signal);
  let res: Response;
  try {
    res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        temperature,
        maxTokens,
        model,
        stream: true,
      }),
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
  if (!proxyBody)
    throw new AIError(0, "AI stream returned no body.", "network");
  yield* parseSSEStream(proxyBody);
}

/**
 * Parse a `text/event-stream` response body into content deltas.
 * OpenRouter emits `data: {json}\n\n` lines, terminated by `data: [DONE]`.
 */
async function* parseSSEStream(
  body: ReadableStream<Uint8Array>
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
              json.error.code
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
 * Sprint 12 : ré-exports depuis ai-prompts pour compat imports
 * ------------------------------------------------------------------ */
export {
  stripHtml,
  generateEmail,
  rewriteText,
  translateText,
  generateSubject,
  smartComplete,
} from "./ai-prompts";
