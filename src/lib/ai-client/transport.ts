import type { AIStreamChunk } from "@/types/ai";

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const AI_PROXY_URL = "/api/ai";
export const REQUEST_TIMEOUT_MS = 30_000;
export const STREAM_TIMEOUT_MS = 60_000;

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

export function getApiKey(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  return (
    process.env.OPENROUTER_API_KEY ?? process.env.NEXT_PUBLIC_AI_API_KEY ?? null
  );
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function canCallDirectly(): boolean {
  if (!isBrowser()) return !!getApiKey();
  return !!process.env.NEXT_PUBLIC_AI_API_KEY;
}

export function buildDirectHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://misfits.ai",
    "X-Title": "misfits.ai Mail",
  };
  const key = getApiKey();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

export function withTimeout(timeoutMs: number, external?: AbortSignal) {
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

export async function toAIError(res: Response): Promise<never> {
  let message = res.statusText || "AI request failed";
  let code: string | undefined;
  try {
    const data = await res.json();
    message = data?.error?.message ?? data?.message ?? message;
    code = data?.error?.code ?? data?.code;
  } catch {
    // no JSON body
  }
  throw new AIError(res.status || 502, message, code);
}

export async function* parseSSEStream(
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
