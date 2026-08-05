import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

describe("/api/hermes/chat route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("forces direct mode when HERMES_PROXY_MODE=direct even if HERMES_GATEWAY_BASE_URL is set", async () => {
    process.env.HERMES_PROXY_MODE = "direct";
    process.env.HERMES_GATEWAY_BASE_URL = "http://backend:8000";
    process.env.HERMES_BASE_URL = "http://hermes:8642/v1";
    process.env.HERMES_API_KEY = "test-key";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://hermes:8642/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key",
    );
  });

  it("uses backend gateway mode when explicitly enabled", async () => {
    process.env.HERMES_PROXY_MODE = "backend";
    process.env.BACKEND_URL = "http://email-api:8000";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 123,
        threadId: "t-1",
        userId: "u-1",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://email-api:8000/api/hermes/chat");

    const payload = JSON.parse(String(init.body));
    expect(payload.maxTokens).toBe(123);
    expect(payload.threadId).toBe("t-1");
    expect(payload.userId).toBe("u-1");
  });

  it("returns 503 in backend mode if no backend base URL is configured", async () => {
    process.env.HERMES_PROXY_MODE = "backend";
    delete process.env.BACKEND_URL;
    delete process.env.HERMES_GATEWAY_BASE_URL;

    const req = new Request("http://localhost/api/hermes/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: {
        message: expect.stringContaining("BACKEND_URL/HERMES_GATEWAY_BASE_URL"),
      },
    });
  });
});
