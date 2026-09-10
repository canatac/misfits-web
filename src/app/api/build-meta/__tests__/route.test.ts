/**
 * Integration test: build-meta route contract.
 *
 * Cross-repo contract: returns current build labels for web and backend.
 * Used by footer to display version info.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("GET /api/build-meta", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns webLabel with SHA format", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sha: "abc1234567def" }), { status: 200 })
    );

    const { GET } = await import("@/app/api/build-meta/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webLabel).toMatch(/^misfits-web@[0-9a-f]{7,40}$/);
  });

  it("returns backendLabel string", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sha: "abc1234" }), { status: 200 })
    );

    const { GET } = await import("@/app/api/build-meta/route");
    const res = await GET();

    const body = await res.json();
    expect(body.backendLabel).toBeDefined();
    expect(typeof body.backendLabel).toBe("string");
  });

  it("returns generatedAt ISO timestamp", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sha: "abc1234" }), { status: 200 })
    );

    const { GET } = await import("@/app/api/build-meta/route");
    const res = await GET();

    const body = await res.json();
    expect(body.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns 200 when GitHub API fails (graceful degradation)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("API failure"));

    const { GET } = await import("@/app/api/build-meta/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.webLabel).toContain("unknown");
  });

  it("returns no-store cache headers", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sha: "abc1234" }), { status: 200 })
    );

    const { GET } = await import("@/app/api/build-meta/route");
    const res = await GET();

    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
