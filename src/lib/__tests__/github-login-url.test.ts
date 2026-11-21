/**
 * The GitHub sign-in starts from the same-origin route (reimagined-guide#736):
 * with the API base of production, the relative "/api", the browser must be
 * sent to /api/auth/oauth/github. `new URL("/api/...")` without a base throws
 * ("is not a valid URL"), which left the button spinning forever.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

async function signIn(redirect?: string): Promise<{ href: string; cookie: string }> {
  vi.resetModules();
  const location = { href: "" };
  const doc = { cookie: "" };
  vi.stubGlobal("window", { location });
  vi.stubGlobal("document", doc);
  const { initiateGithubLogin } = await import("@/lib/api-auth");
  initiateGithubLogin(redirect);
  return { href: location.href, cookie: doc.cookie };
}

describe("initiateGithubLogin", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("goes to the same-origin start route with the relative API base of production", async () => {
    vi.stubEnv("BACKEND_URL", "");
    const { href, cookie } = await signIn("/inbox");
    expect(href).toBe("/api/auth/oauth/github?redirect=%2Finbox");
    expect(cookie).toContain("mfa_post_login_redirect=%2Finbox");
  });

  it("gives no redirect when there is none or when it leaves the site", async () => {
    vi.stubEnv("BACKEND_URL", "");
    expect((await signIn()).href).toBe("/api/auth/oauth/github");
    expect((await signIn("//evil.example/x")).href).toBe("/api/auth/oauth/github");
    expect((await signIn("https://evil.example/x")).href).toBe("/api/auth/oauth/github");
  });

  it("keeps an absolute API base as it is", async () => {
    vi.stubEnv("BACKEND_URL", "https://api.example.test/api");
    expect((await signIn("/inbox")).href).toBe("https://api.example.test/api/auth/oauth/github?redirect=%2Finbox");
  });
});
