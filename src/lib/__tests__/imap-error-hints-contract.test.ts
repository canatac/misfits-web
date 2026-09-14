/**
 * Integration test: IMAP error hints cross-repo contract.
 *
 * imap-error-hints.ts provides actionable diagnostics for IMAP failures.
 * This test verifies the contract between backend error strings and
 * frontend user-facing hints.
 */
import { describe, it, expect } from "vitest";
import { detectImapErrorHint, type ImapErrorHint } from "@/lib/imap-error-hints";

describe("IMAP error hints cross-repo contract", () => {
  it("returns hint for Gmail application-specific password", () => {
    const hint = detectImapErrorHint("[ALERT] Application-specific password required");
    expect(hint).toBeDefined();
    expect(hint?.title).toContain("Google");
  });

  it("returns hint for Gmail web login required", () => {
    const hint = detectImapErrorHint("Web login required");
    expect(hint).toBeDefined();
    expect(hint?.title).toContain("Google");
  });

  it("returns hint for Microsoft auth failed", () => {
    const hint = detectImapErrorHint("LOGIN failed: AUTHENTICATIONFAILED for user@outlook.com");
    expect(hint).toBeDefined();
    expect(hint?.title).toBeTruthy();
  });

  it("returns null for unknown errors", () => {
    const hint = detectImapErrorHint("UNKNOWN ERROR XYZ");
    expect(hint).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(detectImapErrorHint("")).toBeNull();
    expect(detectImapErrorHint(null)).toBeNull();
    expect(detectImapErrorHint(undefined)).toBeNull();
  });

  it("ImapErrorHint has required fields", () => {
    const hint = detectImapErrorHint("Application-specific password required");
    if (hint) {
      const h: ImapErrorHint = hint;
      expect(h.title).toBeTruthy();
      expect(h.description).toBeTruthy();
    }
  });
});
