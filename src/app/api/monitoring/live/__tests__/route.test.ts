/**
 * Integration test: SSE proxy routes for monitoring/security live streams.
 *
 * These routes proxy SSE from the backend (reimagined-guide) to the browser.
 * Critical cross-repo contract:
 *   - Content-Type must be text/event-stream
 *   - X-Accel-Buffering: no (disable nginx buffering)
 *   - Cache-Control: no-cache, no-transform
 *   - Connection: keep-alive
 *   - Upstream errors return 502
 *   - CORS middleware blocks cross-origin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock global fetch for upstream
const fetchMock = vi.fn();
global.fetch = fetchMock;

async function importRoute(modulePath: string) {
  return await import(modulePath);
}

function createSSEResponse(events: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
}

describe("SSE proxy: /api/monitoring/live", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("proxies SSE stream with correct headers", async () => {
    const sseData = [
      'data: {"type":"smtp_event","status":"delivered"}\n\n',
      'data: {"type":"smtp_event","status":"bounced"}\n\n',
    ];
    fetchMock.mockResolvedValue(createSSEResponse(sseData));

    const { GET } = await importRoute("@/app/api/monitoring/live/route");
    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/monitoring/live")
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    expect(res.headers.get("connection")).toBe("keep-alive");
  });

  it("passes message_id query param to upstream", async () => {
    fetchMock.mockResolvedValue(createSSEResponse(["data: {}\n\n"]));

    const { GET } = await importRoute("@/app/api/monitoring/live/route");
    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/monitoring/live?message_id=msg-123")
    );

    await GET(req);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("message_id=msg-123"),
      expect.any(Object)
    );
  });

  it("returns 502 when upstream is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("Connection refused"));

    const { GET } = await importRoute("@/app/api/monitoring/live/route");
    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/monitoring/live")
    );

    const res = await GET(req);
    expect(res.status).toBe(502);
  });

  it("returns upstream error status when upstream fails", async () => {
    fetchMock.mockResolvedValue(
      new Response("Internal Server Error", { status: 500 })
    );

    const { GET } = await importRoute("@/app/api/monitoring/live/route");
    const req = new NextRequest(
      new URL("https://mail.misfits.ai/api/monitoring/live")
    );

    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("SSE proxy: /api/security/live", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("proxies SSE stream with correct headers", async () => {
    const sseData = [
      'data: {"type":"security_event","severity":"high"}\n\n',
    ];
    fetchMock.mockResolvedValue(createSSEResponse(sseData));

    const { GET } = await importRoute("@/app/api/security/live/route");

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
  });

  it("returns 502 when upstream is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("Connection refused"));

    const { GET } = await importRoute("@/app/api/security/live/route");

    const res = await GET();
    expect(res.status).toBe(502);
  });
});
