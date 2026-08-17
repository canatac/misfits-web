/**
 * ai-prompts.ts — high-level AI helpers extracted from ai-client (Sprint 12).
 */
import type {
  AIComposerRequest,
  AIResponse,
  AIStreamChunk,
  AITone,
  AILength,
  AITranslationLang,
} from "@/types/ai";
import { resolveFeatureModel } from "@/lib/ai-settings";
import { chatCompletion, streamChatCompletion } from "@/lib/ai-client";
import {
  buildEmailMessages,
  buildRewriteMessages,
  buildTranslateMessages,
  buildSubjectMessages,
  buildSmartCompleteMessages,
  lengthToTokens,
  parseSubjects,
  stripHtml,
} from "@/lib/ai-prompt-builders";

export { stripHtml };

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
