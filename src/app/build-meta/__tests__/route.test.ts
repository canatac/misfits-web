import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

describe("/build-meta route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns runtime build labels with no-store cache headers", async () => {
    process.env.MISFITS_WEB_BUILD_VERSION = "misfits-web@abc1234";
    process.env.REIMAGINED_GUIDE_BUILD_VERSION = "reimagined-guide@def5678";

    const res = await GET();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toMatchObject({
      webLabel: "misfits-web@abc1234",
      backendLabel: "reimagined-guide@def5678",
    });
    expect(typeof payload.generatedAt).toBe("string");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("falls back to NEXT_PUBLIC labels when runtime labels are absent", async () => {
    delete process.env.MISFITS_WEB_BUILD_VERSION;
    delete process.env.MISFITS_WEB_IMAGE_TAG;
    delete process.env.REIMAGINED_GUIDE_BUILD_VERSION;
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION = "misfits-web@1111111";
    process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION =
      "reimagined-guide@2222222";

    const res = await GET();
    const payload = await res.json();

    expect(payload).toMatchObject({
      webLabel: "misfits-web@1111111",
      backendLabel: "reimagined-guide@2222222",
    });
  });

  it("prefers a git SHA candidate and ignores sha256 digest labels", async () => {
    process.env.MISFITS_WEB_BUILD_VERSION = "misfits-web@sha256:deadbeef";
    process.env.MISFITS_WEB_IMAGE_TAG = "a9e180ea0ef162255bac85ebacb7f754293864dc";
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION =
      "misfits-web@sha256:anotherdigest";

    const res = await GET();
    const payload = await res.json();

    expect(payload.webLabel).toBe(
      "misfits-web@a9e180ea0ef162255bac85ebacb7f754293864dc"
    );
  });

  it("falls back to GitHub master SHA when env only contains image digests", async () => {
    process.env.MISFITS_WEB_BUILD_VERSION = "misfits-web@sha256:deadbeef";
    process.env.MISFITS_WEB_IMAGE_TAG = "sha256:beadfeed";
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION =
      "misfits-web@sha256:cafebabe";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ sha: "2cbc79b1bfef6cea85e28b9cfbc4b5ef5a39a655" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const res = await GET();
    const payload = await res.json();

    expect(payload.webLabel).toBe(
      "misfits-web@2cbc79b1bfef6cea85e28b9cfbc4b5ef5a39a655"
    );
  });
});
