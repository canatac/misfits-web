/**
 * Regression test: GET /api/health mongo-health (issue #929, MW-2026-054).
 *
 * Verifies the health endpoint returns:
 * - 200 when backend mongo-health is reachable
 * - 503 when backend is unreachable (Docker DNS failure, network partition)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

describe("Issue #929: GET /api/health mongo-health regression", () => {
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
        JSON.stringify({ status: "healthy", mongo: "connected" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
  });

  it("returns 503 when backend mongo-health returns non-200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "unhealthy", mongo: "timeout" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
  });

  it("returns 503 when backend is unreachable (network error)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
    expect(body.reason).toBeDefined();
  });
});
