/**
 * Repository couche réseau pour chat-store.
 *
 * Extrait les appels HTTP vers l'API Hermes :
 * - POST /api/hermes/chat  (mode non-tracé, réponse JSON one-shot)
 * - POST /api/hermes/runs  (mode tracé, retourne run_id)
 * - GET  /api/hermes/runs/:id/events?stream=true  (flux SSE)
 *
 * Copie verbatim des headers, URLs et bodies depuis src/stores/chat-store.ts.
 */

export interface ChatMessagePayload {
  role: string;
  content: string;
}

export interface ChatContext {
  threadId?: string;
  userId?: string;
  sessionId?: string;
  sessionKey?: string;
}

export interface ChatRequest extends ChatContext {
  messages: ChatMessagePayload[];
}

export interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  content?: string;
  [key: string]: unknown;
}

export interface RunRequest extends ChatContext {
  input: string;
  model: string;
}

export interface RunResponse {
  run_id?: string;
  id?: string;
  [key: string]: unknown;
}

export interface ChatRepository {
  postChat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;
  createRun(request: RunRequest, signal?: AbortSignal): Promise<RunResponse>;
  streamRunEvents(
    runId: string,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
}

export class HttpChatRepository implements ChatRepository {
  async postChat(
    request: ChatRequest,
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    const res = await fetch("/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Hermes request failed");
      throw new Error(errorText || `Hermes request failed (${res.status})`);
    }
    return (await res.json()) as ChatResponse;
  }

  async createRun(
    request: RunRequest,
    signal?: AbortSignal
  ): Promise<RunResponse> {
    const res = await fetch("/api/hermes/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Hermes run failed");
      throw new Error(errorText || `Hermes run failed (${res.status})`);
    }
    return (await res.json().catch(() => ({}))) as RunResponse;
  }

  async streamRunEvents(
    runId: string,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(
      `/api/hermes/runs/${encodeURIComponent(runId)}/events?stream=true`,
      {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        signal,
      }
    );
    if (!res.ok || !res.body) {
      const errorText = await res.text().catch(() => "Hermes events failed");
      throw new Error(errorText || `Hermes events failed (${res.status})`);
    }
    return res.body;
  }
}

export const chatRepository: ChatRepository = new HttpChatRepository();
