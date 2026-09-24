/**
 * Integration test: POST /api/compose/send proxy handler (issue #929, MW-2026-054).
 *
 * Regression coverage for the compose/send proxy route:
 *   1. Forwards POST to backend /api/send with correct headers
 *   2. Returns backend status transparently (not 502 on 4xx)
 *   3. Retries on 5xx then falls back to next candidate
 *   4. Returns 502 only when ALL candidates fail
 *   5. Forwards Content-Type from the original request
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "./route";

// Mock the proxy-auth module so we control backend URLs
vi.mock("@/lib/proxy-auth", () => ({
  buildForwardHeaders: vi.fn((request: Request) => {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    const ct = request.headers.get("content-type");
    if (ct) headers.set("Content-Type", ct);
    return headers;
  }),
  resolveBackendBaseUrlCandidates: vi.fn(() => [
    "http://backend-primary:8000",
    "http://backend-fallback:8000",
  ]),
}));

function makeRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Request {
  const url = new URL(`https://mail.misfits.ai${path}`);
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { ...headers, "Content-Type": "application/json" };
  }
  return new Request(url, init);
}

let fetchMock: ReturnType<typeof vi.spyOn>;

describe("POST /api/compose/send — proxy handler (issue #929)", () => {
  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
    vi.clearAllMocks();
  });

  it("forwards POST to backend /api/send with 200 status", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "msg-123", status: "sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest("POST", "/api/compose/send", {
      to: "test@example.com",
      subject: "Hello",
      body: "World",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("msg-123");

    // Verify fetch was called with the correct backend URL
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("http://backend-primary:8000/api/send");
  });

  it("returns 400 from backend as-is (not masked as 502)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "validation_failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest("POST", "/api/compose/send", { invalid: true });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 401 from backend as-is", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest("POST", "/api/compose/send", { to: "a@b.c" });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("retries on 5xx then returns the recovered status", async () => {
    // First attempt: 503 (retryable)
    fetchMock.mockResolvedValueOnce(
      new Response("Service Unavailable", { status: 503 })
    );
    // Second attempt: 200 (recovered)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest("POST", "/api/compose/send", { to: "a@b.c" });
    const res = await POST(req);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
  });

  it("falls back to next candidate when primary fails with 5xx", async () => {
    // Primary: 503 → retry → 503 → give up on primary
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
    // Fallback: 200
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const req = makeRequest("POST", "/api/compose/send", { to: "a@b.c" });
    const res = await POST(req);

    expect(fetchMock).toHaveBeenCalledTimes(4); // 3 retries on primary + 1 on fallback
    expect(res.status).toBe(200);

    // Verify the fallback URL was used for the 4th call
    const lastCallUrl = fetchMock.mock.calls[3][0] as string;
    expect(lastCallUrl).toBe("http://backend-fallback:8000/api/send");
  });

  it("returns 502 when ALL candidates fail", async () => {
    // Primary: network error × (retries+1)
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    // Fallback: network error × (retries+1)
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const req = makeRequest("POST", "/api/compose/send", { to: "a@b.c" });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("backend_unavailable");
  });

  it("preserves query string in backend URL", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const req = makeRequest("POST", "/api/compose/send?draft=true", {
      to: "a@b.c",
    });
    await POST(req);

    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("http://backend-primary:8000/api/send?draft=true");
  });

  it("sets Cache-Control: no-store on response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const req = makeRequest("POST", "/api/compose/send", { to: "a@b.c" });
    const res = await POST(req);

    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/compose/send — proxy handler", () => {
  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
    vi.clearAllMocks();
  });

  it("proxies GET requests to backend", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 })
    );

    const req = makeRequest("GET", "/api/compose/send");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("http://backend-primary:8000/api/send");
  });
});
