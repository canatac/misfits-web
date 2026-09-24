/**
 * Regression test: POST /api/compose/send (issue #929, MW-2026-054).
 *
 * Verifies the compose/send proxy route returns proper status codes:
 * - 400 when backend validates missing/invalid body
 * - 502 when backend is unreachable
 * - Auth headers are forwarded to the backend
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

describe("Issue #929: POST /api/compose/send regression", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "production";
    process.env.BACKEND_URL = "http://email-api:8000";
  });

  afterEach(() => {
    process.env = { originalEnv };
  });

  it("returns 400 when backend rejects empty body (validation works)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: "validation", message: "missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("https://mail.misfits.ai/api/compose/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 when backend is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("https://mail.misfits.ai/api/compose/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "test@example.com", subject: "hi" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("backend_unavailable");
  });

  it("forwards Authorization header to backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("https://mail.misfits.ai/api/compose/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ to: "test@example.com" }),
    });

    await POST(req);

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("forwards Cookie header to backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("https://mail.misfits.ai/api/compose/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: "mfa_session=abc123",
      },
      body: JSON.stringify({ to: "test@example.com" }),
    });

    await POST(req);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Cookie")).toBe("mfa_session=abc123");
  });
});
