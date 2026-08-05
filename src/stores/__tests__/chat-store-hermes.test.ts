import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "@/stores/chat-store";

function resetChatStore() {
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    isStreaming: false,
    error: null,
    isOpen: false,
    traceEnabled: false,
    traceEvents: [],
  });
}

describe("chat-store Hermes proxy", () => {
  beforeEach(() => {
    localStorage.clear();
    resetChatStore();
    vi.restoreAllMocks();
  });

  it("sends messages to /api/hermes/chat with session context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok-from-hermes" } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await useChatStore.getState().sendMessage("Bonjour", {
      threadId: "thread-123",
      userId: "user-9",
      currentEmailId: "mail-1",
      currentFolder: "inbox",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/hermes/chat");

    const payload = JSON.parse(String(init.body));
    expect(payload.threadId).toBe("thread-123");
    expect(payload.userId).toBe("user-9");
    expect(payload.sessionId).toBe("mail-thread-thread-123");
    expect(payload.sessionKey).toBe("user-user-9");
    expect(Array.isArray(payload.messages)).toBe(true);

    const conv = useChatStore.getState().conversations[0];
    expect(conv.messages.at(-1)?.role).toBe("assistant");
    expect(conv.messages.at(-1)?.content).toBe("ok-from-hermes");
    expect(useChatStore.getState().error).toBeNull();
  });

  it("preserves explicit session overrides when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok-from-hermes" } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await useChatStore.getState().sendMessage("Bonjour", {
      threadId: "thread-123",
      userId: "user-9",
      sessionId: "mail-thread-explicit",
      sessionKey: "user-explicit",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body));
    expect(payload.sessionId).toBe("mail-thread-explicit");
    expect(payload.sessionKey).toBe("user-explicit");
  });

  it("streams Hermes run events in trace mode", async () => {
    useChatStore.getState().setTraceEnabled(true);

    const encoder = new TextEncoder();
    const ssePayload = [
      'data: {"event":"message.delta","delta":"Bon"}\n\n',
      'data: {"event":"message.delta","delta":"jour"}\n\n',
      'data: {"event":"run.completed","output":"Bonjour","usage":{"total_tokens":123}}\n\n',
    ].join("");

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/hermes/runs") {
        return new Response(JSON.stringify({ run_id: "run_test_1" }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === "/api/hermes/runs/run_test_1/events?stream=true") {
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(ssePayload));
              controller.close();
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          },
        );
      }

      return new Response("not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await useChatStore.getState().sendMessage("Bonjour", {
      threadId: "thread-1",
      userId: "user-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useChatStore.getState().isStreaming).toBe(false);

    const conv = useChatStore.getState().conversations[0];
    expect(conv.messages.at(-1)?.role).toBe("assistant");
    expect(conv.messages.at(-1)?.content).toBe("Bonjour");

    const traceEvents = useChatStore.getState().traceEvents;
    expect(traceEvents.length).toBeGreaterThan(0);
    expect(traceEvents.some((e) => e.kind === "run.completed")).toBe(true);
  });

  it("sets a Hermes error when upstream fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "boom" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await useChatStore.getState().sendMessage("Test erreur", {
      threadId: "thread-500",
    });

    expect(useChatStore.getState().isStreaming).toBe(false);
    expect(useChatStore.getState().error).toBe("Failed to get Hermes response");
  });
});
