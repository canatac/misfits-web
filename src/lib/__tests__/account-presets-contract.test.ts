/**
 * Integration test: Account presets cross-repo contract.
 *
 * account-presets.ts defines IMAP/SMTP server configurations per provider.
 * This test verifies the contract between frontend account setup and
 * backend external-accounts-api expectations.
 */
import { describe, it, expect } from "vitest";
import { PROVIDER_PRESETS, ACCOUNT_COLORS } from "@/lib/account-presets";

describe("Account presets cross-repo contract", () => {
  it("ACCOUNT_COLORS is non-empty array of hex colors", () => {
    expect(ACCOUNT_COLORS.length).toBeGreaterThan(0);
    for (const color of ACCOUNT_COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("PROVIDER_PRESETS has Gmail config", () => {
    const gmail = PROVIDER_PRESETS.gmail;
    expect(gmail).toBeDefined();
    expect(gmail.label).toBe("Gmail");
    expect(gmail.needsServerFields).toBe(false);
    expect(gmail.serverConfig?.imapHost).toBe("imap.gmail.com");
    expect(gmail.serverConfig?.smtpHost).toBe("smtp.gmail.com");
  });

  it("PROVIDER_PRESETS has Outlook config", () => {
    const outlook = PROVIDER_PRESETS.outlook;
    expect(outlook).toBeDefined();
    expect(outlook.label).toBe("Outlook");
    expect(outlook.serverConfig?.imapHost).toContain("office365.com");
  });

  it("PROVIDER_PRESETS has Proton config", () => {
    const proton = PROVIDER_PRESETS.proton;
    expect(proton).toBeDefined();
    expect(proton.serverConfig?.imapHost).toBeTruthy();
  });

  it("PROVIDER_PRESETS has Custom config", () => {
    const custom = PROVIDER_PRESETS.custom;
    expect(custom).toBeDefined();
    expect(custom.needsServerFields).toBe(true);
  });

  it("server configs have required fields for backend", () => {
    for (const [provider, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (!preset.serverConfig) continue;
      const cfg = preset.serverConfig;
      expect(cfg.imapHost).toBeDefined();
      expect(cfg.imapPort).toBeGreaterThan(0);
      expect(cfg.smtpHost).toBeDefined();
      expect(cfg.smtpPort).toBeGreaterThan(0);
    }
  });

  it("IMAP ports are positive integers", () => {
    for (const [, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (!preset.serverConfig) continue;
      expect(preset.serverConfig.imapPort).toBeGreaterThan(0);
      expect(preset.serverConfig.imapPort).toBeLessThan(65536);
    }
  });

  it("SMTP ports are positive integers", () => {
    for (const [, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (!preset.serverConfig) continue;
      expect(preset.serverConfig.smtpPort).toBeGreaterThan(0);
      expect(preset.serverConfig.smtpPort).toBeLessThan(65536);
    }
  });

  it("security values are valid (ssl/starttls/none)", () => {
    const valid = ["ssl", "starttls", "none"];
    for (const [, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (!preset.serverConfig) continue;
      expect(valid).toContain(preset.serverConfig.imapSecurity);
      expect(valid).toContain(preset.serverConfig.smtpSecurity);
    }
  });
});
