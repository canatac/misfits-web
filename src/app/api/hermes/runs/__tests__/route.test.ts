import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

describe("/api/hermes/runs route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses backend gateway mode when explicitly enabled", async () => {
    process.env.HERMES_PROXY_MODE = "backend";
    process.env.BACKEND_URL = "http://email-api:8000";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "run_1", status: "queued" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/hermes/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: [{ role: "user", content: "hello" }],
        model: "hermes-agent",
        threadId: "t-1",
        userId: "u-1",
        sessionId: "mail-thread-explicit",
        sessionKey: "user-explicit",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://email-api:8000/api/hermes/runs");

    const payload = JSON.parse(String(init.body));
    expect(payload.input).toBeTruthy();
    expect(payload.model).toBe("hermes-agent");
    expect(payload.threadId).toBe("t-1");
    expect(payload.userId).toBe("u-1");
    expect(payload.sessionId).toBe("mail-thread-explicit");
    expect(payload.sessionKey).toBe("user-explicit");
  });

  it("returns 503 in backend mode if no backend base URL is configured", async () => {
    process.env.HERMES_PROXY_MODE = "backend";
    delete process.env.BACKEND_URL;
    delete process.env.HERMES_GATEWAY_BASE_URL;

    const req = new Request("http://localhost/api/hermes/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: [{ role: "user", content: "hello" }],
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
