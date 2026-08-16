/**
 * OpenRouter-compatible AI client for misfits.ai Mail.
 * Low-level completion + transport helpers in ./ai-client/*.
 */
import type {
  AIResponse,
  AIStreamChunk,
  ChatMessage,
  CompletionOptions,
} from "@/types/ai";
import {
  AIError,
  AI_PROXY_URL,
  OPENROUTER_URL,
  REQUEST_TIMEOUT_MS,
  STREAM_TIMEOUT_MS,
  buildDirectHeaders,
  canCallDirectly,
  parseSSEStream,
  toAIError,
  withTimeout,
} from "./ai-client/transport";

export { AIError, getApiKey } from "./ai-client/transport";

export const AI_MODEL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_AI_MODEL || process.env.AI_MODEL)) ||
  "qwen/qwen3.7-flash";

/* ------------------------------------------------------------------ *
 * Low-level completion (direct OpenRouter calls)
 * ------------------------------------------------------------------ */

export async function chatCompletionDirect(
  messages: ChatMessage[],
  opts: CompletionOptions = {}
): Promise<AIResponse> {
  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const body = { model, messages, temperature, max_tokens: maxTokens, stream: false };

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

export async function* streamChatCompletionDirect(
  messages: ChatMessage[],
  opts: CompletionOptions = {}
): AsyncGenerator<AIStreamChunk> {
  const { temperature = 0.7, maxTokens = 1024, signal, model = AI_MODEL } = opts;
  const body = { model, messages, temperature, max_tokens: maxTokens, stream: true };

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
 * Transport-aware completion
 * ------------------------------------------------------------------ */

export async function chatCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions = {}
): Promise<AIResponse> {
  if (canCallDirectly()) return chatCompletionDirect(messages, opts);

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

export async function* streamChatCompletion(
  messages: ChatMessage[],
  opts: CompletionOptions = {}
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
