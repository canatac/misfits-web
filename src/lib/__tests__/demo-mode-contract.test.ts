/**
 * Integration test: Demo mode cross-repo contract.
 *
 * demo-mode.ts creates fallback sessions when the backend is unreachable.
 * This test verifies the contract between demo sessions and the auth
 * type expectations.
 */
import { describe, it, expect } from "vitest";
import { createDemoSession, shouldUseDemoMode, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-mode";
import type { Session } from "@/types/auth";

describe("Demo mode cross-repo contract", () => {
  it("DEMO_EMAIL is valid misfits.ai address", () => {
    expect(DEMO_EMAIL).toContain("@misfits.ai");
  });

  it("DEMO_PASSWORD is non-empty", () => {
    expect(DEMO_PASSWORD).toBeTruthy();
    expect(DEMO_PASSWORD.length).toBeGreaterThan(0);
  });

  it("createDemoSession returns valid Session shape", () => {
    const session = createDemoSession("demo@misfits.ai");
    const s: Session = session;
    expect(s.id).toBeTruthy();
    expect(s.accessToken).toBeTruthy();
    expect(s.refreshToken).toBeTruthy();
    expect(s.expiresAt).toBeGreaterThan(Date.now());
  });

  it("demo session has demo-user role", () => {
    const session = createDemoSession("demo@misfits.ai");
    expect(session.user.id).toBe("demo-user");
    expect(session.user.role).toBe("user");
  });

  it("demo session token starts with demo-", () => {
    const session = createDemoSession("demo@misfits.ai");
    expect(session.accessToken).toContain("demo-");
    expect(session.refreshToken).toContain("demo-");
  });

  it("shouldUseDemoMode returns boolean", () => {
    const result = shouldUseDemoMode();
    expect(typeof result).toBe("boolean");
  });

  it("createDemoSession lowercases email", () => {
    const session = createDemoSession("DEMO@MISFITS.AI");
    expect(session.user.email).toBe("demo@misfits.ai");
  });

  it("createDemoSession derives displayName from email", () => {
    const session = createDemoSession("testuser@misfits.ai");
    expect(session.user.displayName).toBe("testuser");
  });
});
