import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "../route";

describe("/build-meta route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
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
    delete process.env.REIMAGINED_GUIDE_BUILD_VERSION;
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION = "misfits-web@11111";
    process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION =
      "reimagined-guide@22222";

    const res = await GET();
    const payload = await res.json();

    expect(payload).toMatchObject({
      webLabel: "misfits-web@11111",
      backendLabel: "reimagined-guide@22222",
    });
  });
});
