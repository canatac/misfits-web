/**
 * Integration test: Hermes chat route session header contract.
 *
 * Cross-repo contract: /api/hermes/chat must forward X-Hermes-Session-Id
 * and X-Hermes-Session-Key headers so the Hermes service can scope chat
 * sessions to user/thread.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

describe("POST /api/hermes/chat session header contract", () => {
  const originalBackendUrl = process.env.BACKEND_URL;
  const originalHermesKey = process.env.HERMES_API_KEY;
  const originalProxyMode = process.env.HERMES_PROXY_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    // Force direct mode (not backend gateway)
    delete process.env.BACKEND_URL;
    process.env.HERMES_API_KEY = "test-key";
    process.env.HERMES_PROXY_MODE = "direct";
  });

  afterEach(() => {
    if (originalBackendUrl) process.env.BACKEND_URL = originalBackendUrl;
    else delete process.env.BACKEND_URL;
    if (originalHermesKey) process.env.HERMES_API_KEY = originalHermesKey;
    else delete process.env.HERMES_API_KEY;
    if (originalProxyMode) process.env.HERMES_PROXY_MODE = originalProxyMode;
    else delete process.env.HERMES_PROXY_MODE;
  });

  it("sets X-Hermes-Session-Id from sessionId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const { POST } = await import("@/app/api/hermes/chat/route");

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
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const { POST } = await import("@/app/api/hermes/chat/route");

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
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    global.fetch = fetchMock;

    const { POST } = await import("@/app/api/hermes/chat/route");

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
    const headers = call![1]?.headers as Record<string, string>;
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
