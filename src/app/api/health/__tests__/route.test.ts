/**
 * Regression test: GET /api/health liveness probe (issue #999, MW-2026-101).
 *
 * Verifies the lightweight health endpoint returns:
 * - 200 when backend is reachable (any HTTP response = alive)
 * - 503 when backend is unreachable (DNS failure, network partition)
 *
 * This is the Docker healthcheck endpoint — must NOT depend on MongoDB.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

describe("Issue #999: GET /api/health liveness probe", () => {
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

  it("returns 200 when backend is reachable (HEAD response)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.backend).toBe("http://email-api:8000");
  });

  it("returns 200 even when backend returns non-200 (process is alive)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 404 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
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

  it("returns 503 when backend times out (AbortController)", async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((_, reject) => {
        setTimeout(() => reject(new Error("The operation was aborted")), 3000);
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("unhealthy");
  });
});
