/**
 * ai-draft-client.ts — AI draft generation client for misfits.ai Mail.
 *
 * Calls the Hermes AI API to generate email drafts, summaries,
 * and instant replies. Handles loading states, errors, and fallback
 * when the AI service is unavailable.
 */

export interface DraftRequest {
  threadId?: string;
  originalEmailId?: string;
  context: string;
  tone?: "professional" | "friendly" | "formal" | "casual";
  language?: string;
  maxLength?: number;
}

export interface DraftResponse {
  draft: string;
  confidence: number;
  suggestions?: string[];
}

export interface SummaryRequest {
  emailIds: string[];
  threadId?: string;
  maxLength?: number;
}

export interface SummaryResponse {
  summary: string;
  actionItems: string[];
  keyPoints: string[];
}

export interface InstantReplyRequest {
  emailId: string;
  context: string;
  tone?: "professional" | "friendly" | "formal" | "casual";
}

export interface InstantReplyResponse {
  reply: string;
  confidence: number;
}

export interface AIClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  retryCount?: number;
}

export class AIDraftClient {
  private baseUrl: string;
  private timeoutMs: number;
  private retryCount: number;

  constructor(options?: AIClientOptions) {
    this.baseUrl = options?.baseUrl ?? "/api/hermes";
    this.timeoutMs = options?.timeoutMs ?? 30000;
    this.retryCount = options?.retryCount ?? 2;
  }

  async generateDraft(request: DraftRequest): Promise<DraftResponse> {
    return this.fetchWithRetry<DraftResponse>("/ai/draft", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async generateSummary(request: SummaryRequest): Promise<SummaryResponse> {
    return this.fetchWithRetry<SummaryResponse>("/ai/summary", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async generateInstantReply(request: InstantReplyRequest): Promise<InstantReplyResponse> {
    return this.fetchWithRetry<InstantReplyResponse>("/ai/instant-reply", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchWithRetry<T>(path: string, init: RequestInit): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.retryCount) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError ?? new Error("AI request failed");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createAIDraftClient(options?: AIClientOptions): AIDraftClient {
  return new AIDraftClient(options);
}

/**
 * Fallback draft generator when AI is unavailable.
 * Uses simple heuristics to generate a basic response.
 */
export function generateFallbackDraft(context: string, tone: string = "professional"): string {
  const greetings: Record<string, string> = {
    professional: "Dear colleague,",
    friendly: "Hi,",
    formal: "Dear sir/madam,",
    casual: "Hey,",
  };

  const closings: Record<string, string> = {
    professional: "Best regards,",
    friendly: "Cheers,",
    formal: "Yours sincerely,",
    casual: "Thanks,",
  };

  const greeting = greetings[tone] ?? greetings.professional;
  const closing = closings[tone] ?? closings.professional;

  return `${greeting}

[AI draft unavailable — please write your response here]

${closing}`;
}

/**
 * Extract action items from email text using simple heuristics.
 * Used as fallback when AI classification is unavailable.
 */
export function extractActionItems(text: string): string[] {
  const actionPatterns = [
    /please\s+(.+?)(?:\.|$)/gi,
    /can you\s+(.+?)(?:\.|$)/gi,
    /could you\s+(.+?)(?:\.|$)/gi,
    /need you to\s+(.+?)(?:\.|$)/gi,
    /action required:\s*(.+?)(?:\.|$)/gi,
    /todo:\s*(.+?)(?:\.|$)/gi,
    /task:\s*(.+?)(?:\.|$)/gi,
  ];

  const items: string[] = [];
  for (const pattern of actionPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1]?.trim();
      if (item && item.length > 5 && !items.includes(item)) {
        items.push(item);
      }
    }
  }

  return items.slice(0, 10);
}

/**
 * Summarize text using extractive summarization (fallback).
 * Takes the first sentence of each paragraph.
 */
export function generateFallbackSummary(text: string, maxSentences: number = 3): string {
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences.slice(0, maxSentences).join(". ") + ".";
}
