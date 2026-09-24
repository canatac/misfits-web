/**
 * Regression test: GET /api/health/deep MongoDB connectivity check (issue #999, MW-2026-101).
 *
 * Verifies the deep health endpoint returns:
 * - 200 when backend mongo-health reports healthy
 * - 503 when backend mongo-health returns non-200 (MongoDB timeout)
 * - 503 when backend is unreachable
 *
 * This is the monitoring endpoint — DOES depend on MongoDB.
 * Not used by Docker healthcheck (uses /api/health instead).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

describe("Issue #999: GET /api/health/deep MongoDB connectivity", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });
    process.env.BACKEND_URL = "http://email-api:8000";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 200 when backend mongo-health is healthy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "healthy", mongo_ping_ms: 42 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.component).toBe("mongodb");
  });

  it("returns 503 when backend mongo-health reports unhealthy (timeout)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "unhealthy", mongo_ping_ms: 5001 }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
    expect(body.component).toBe("mongodb");
  });

  it("returns 503 when backend is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
    expect(body.component).toBe("backend");
  });
});
