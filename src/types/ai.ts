/**
 * AI domain types for the misfits.ai Mail composer assistant.
 *
 * These describe chat messages, completion responses (streaming + full),
 * generation options (tone, length, translation language), composer
 * requests and conversation history used by the AI client, store, hooks
 * and UI components.
 */

/** Role of a chat message exchanged with the LLM. */
export type ChatRole = "system" | "user" | "assistant";

/** A single chat message sent to / returned from the model. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Token-usage telemetry returned by the provider (optional). */
export interface AIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** A complete (non-streaming) AI response. */
export interface AIResponse {
  /** Generated text (HTML for email generation, plain for subjects). */
  content: string;
  role: "assistant";
  /** Model that produced the response. */
  model?: string;
  /** Token usage, when reported by the provider. */
  usage?: AIUsage;
  /** Why generation stopped (e.g. "stop", "length"). */
  finishReason?: string;
}

/** A single chunk emitted while streaming a response. */
export interface AIStreamChunk {
  /** Incremental text delta for this chunk. */
  content: string;
  /** True once the stream has completed. */
  done: boolean;
}

/** Writing tone for generated emails. */
export type AITone =
  | "professionnel"
  | "amical"
  | "direct"
  | "formel"
  | "decontracte";

/** Target length for generated emails. */
export type AILength = "concis" | "standard" | "detaille";

/** Languages supported by the translation helper. */
export type AITranslationLang = "fr" | "en" | "es" | "de" | "it";

/** Extra context the model can use when generating an email. */
export interface AIContext {
  /** Subject of the email being composed, if known. */
  subject?: string;
  /** Recipient display names / emails, for personalisation. */
  recipients?: string[];
  /** Prior thread messages (plain text) for replies. */
  threadContext?: string;
}

/** Request payload for the AI composer (email generation). */
export interface AIComposerRequest {
  /** Natural-language prompt describing what to write. */
  prompt: string;
  /** Desired tone. */
  tone: AITone;
  /** Desired length. */
  length: AILength;
  /** Target language for the generated email (translation). */
  language?: AITranslationLang;
  /** Optional composer context. */
  context?: AIContext;
}

/** A stored AI conversation (used for the recent-prompts history). */
export interface AIConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
}

/** Options accepted by the low-level completion helpers. */
export interface CompletionOptions {
  /** Sampling temperature (0–2). */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Override the default model. */
  model?: string;
  /** Abort the request externally. */
  signal?: AbortSignal;
}
