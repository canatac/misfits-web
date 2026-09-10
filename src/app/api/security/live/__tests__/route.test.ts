/**
 * Integration test: SSE proxy routes for security + external accounts.
 *
 * These routes proxy SSE from the backend to the browser.
 * Contract: Content-Type, Cache-Control, X-Accel-Buffering headers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

describe("SSE proxy: /api/security/live", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("proxies SSE with correct headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"severity":"high"}\n\n')
            );
            controller.close();
          },
        }),
        {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }
      )
    );
    global.fetch = fetchMock;

    const { GET } = await import("@/app/api/security/live/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
  });

  it("returns 502 when upstream is unreachable", async () => {
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.reject(new Error("refused"))
    );

    const { GET } = await import("@/app/api/security/live/route");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});

describe("SSE proxy: /api/external-accounts/probe-stream", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("proxies POST SSE with correct headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: {"frame":"ready"}\n\n')
            );
            controller.close();
          },
        }),
        {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }
      )
    );
    global.fetch = fetchMock;

    const { POST } = await import("@/app/api/external-accounts/probe-stream/route");

    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/external-accounts/probe-stream"),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token123",
          cookie: "mfa_session=abc",
        },
        body: JSON.stringify({ host: "imap.gmail.com" }),
      }
    );

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("returns upstream status when backend fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Backend error", { status: 500 })
    );

    const { POST } = await import("@/app/api/external-accounts/probe-stream/route");

    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/external-accounts/probe-stream"),
      { method: "POST", body: "{}" }
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
