import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

describe("/api/hermes/runs/[runId] route", () => {
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
      new Response(JSON.stringify({ id: "run_1", status: "completed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/hermes/runs/run_1");

    const res = await GET(req as any, {
      params: Promise.resolve({ runId: "run_1" }),
    });

    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://email-api:8000/api/hermes/runs/run_1");
    expect(init.method).toBe("GET");
  });

  it("returns 503 in backend mode if no backend base URL is configured", async () => {
    process.env.HERMES_PROXY_MODE = "backend";
    delete process.env.BACKEND_URL;
    delete process.env.HERMES_GATEWAY_BASE_URL;

    const req = new Request("http://localhost/api/hermes/runs/run_1");

    const res = await GET(req as any, {
      params: Promise.resolve({ runId: "run_1" }),
    });

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: {
        message: expect.stringContaining("BACKEND_URL/HERMES_GATEWAY_BASE_URL"),
      },
    });
  });
});
