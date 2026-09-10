/**
 * Integration test: Hermes chat route session header contract.
 *
 * Cross-repo contract: /api/hermes/chat must forward X-Hermes-Session-Id
 * and X-Hermes-Session-Key headers so the Hermes service can scope chat
 * sessions to user/thread.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

describe("POST /api/hermes/chat session header contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets X-Hermes-Session-Id from sessionId", async () => {
    const { POST } = await import("@/app/api/hermes/chat/route");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const req = new NextRequest(new URL("https://mail.misfits.ai/api/hermes/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        sessionId: "thread-123",
        sessionKey: "user-456",
      }),
    });

    await POST(req);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Hermes-Session-Id": "thread-123",
          "X-Hermes-Session-Key": "user-456",
        }),
      })
    );
  });

  it("derives X-Hermes-Session-Id from threadId when sessionId absent", async () => {
    const { POST } = await import("@/app/api/hermes/chat/route");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const req = new NextRequest(new URL("https://mail.misfits.ai/api/hermes/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        threadId: "thread-789",
        userId: "user-101",
      }),
    });

    await POST(req);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Hermes-Session-Id": "mail-thread-789",
          "X-Hermes-Session-Key": "user-101",
        }),
      })
    );
  });

  it("sanitizes CRLF from session headers", async () => {
    const { POST } = await import("@/app/api/hermes/chat/route");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const req = new NextRequest(new URL("https://mail.misfits.ai/api/hermes/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        sessionId: "valid\r\ninjection",
        sessionKey: "user-456",
      }),
    });

    await POST(req);

    const call = fetchMock.mock.calls[0];
    const headers = call[1]?.headers as Record<string, string>;
    expect(headers["X-Hermes-Session-Id"]).not.toContain("\r");
    expect(headers["X-Hermes-Session-Id"]).not.toContain("\n");
  });

  it("returns 503 when HERMES_API_KEY missing", async () => {
    delete process.env.HERMES_API_KEY;
    const { POST } = await import("@/app/api/hermes/chat/route");

    const req = new NextRequest(new URL("https://mail.misfits.ai/api/hermes/chat"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
