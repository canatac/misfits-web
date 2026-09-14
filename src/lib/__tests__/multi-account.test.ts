/**
 * Unit tests for multi-account aggregation utilities.
 */
import { describe, it, expect } from "vitest";
import {
  PROVIDER_PRESETS,
  TIER_LIMITS,
  getProviderPreset,
  buildServerConfig,
  canAddAccount,
  filterEmailsByAccount,
  getEmailAccountBadge,
  groupEmailsByAccount,
  countEmailsPerAccount,
  getProviderLabel,
  isValidEmail,
  getNextAccountColor,
} from "@/lib/multi-account";
import type { EmailAccount } from "@/types/account";
import type { Email } from "@/types/email";

function makeAccount(overrides: Partial<EmailAccount> = {}): EmailAccount {
  return {
    id: "acc-1",
    email: "test@misfits.ai",
    name: "Test",
    provider: "misfits",
    color: "#3b5bff",
    isDefault: true,
    aliases: [],
    connectedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Sender", address: "sender@example.com" },
    to: [{ name: "Recipient", address: "recipient@example.com" }],
    subject: "Test",
    preview: "Preview",
    body: "<p>Body</p>",
    bodyType: "html",
    date: "2026-09-10T12:00:00Z",
    receivedAt: "2026-09-10T12:00:00Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1024,
    messageId: "<test@example.com>",
    ...overrides,
  };
}

describe("multi-account", () => {
  describe("getProviderPreset", () => {
    it("returns Gmail preset", () => {
      const preset = getProviderPreset("gmail");
      expect(preset).toBeDefined();
      expect(preset?.imapHost).toBe("imap.gmail.com");
      expect(preset?.smtpHost).toBe("smtp.gmail.com");
    });

    it("returns Outlook preset", () => {
      const preset = getProviderPreset("outlook");
      expect(preset?.imapHost).toBe("outlook.office365.com");
    });

    it("returns null for custom provider", () => {
      expect(getProviderPreset("custom")).toBeNull();
    });

    it("returns null for misfits provider", () => {
      expect(getProviderPreset("misfits")).toBeNull();
    });
  });

  describe("buildServerConfig", () => {
    it("builds config from preset", () => {
      const config = buildServerConfig("gmail");
      expect(config).toBeDefined();
      expect(config?.imapPort).toBe(993);
      expect(config?.imapSecurity).toBe("ssl");
    });

    it("returns undefined for custom", () => {
      expect(buildServerConfig("custom")).toBeUndefined();
    });
  });

  describe("canAddAccount", () => {
    it("allows adding when under limit", () => {
      const accounts = [makeAccount()];
      const result = canAddAccount(accounts, "pro");
      expect(result.allowed).toBe(true);
    });

    it("blocks when free tier limit reached", () => {
      const accounts = [makeAccount()];
      const result = canAddAccount(accounts, "free");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("limit");
    });

    it("allows adding second account on pro tier", () => {
      const accounts = [makeAccount(), makeAccount({ id: "acc-2", provider: "gmail" })];
      const result = canAddAccount(accounts, "pro");
      expect(result.allowed).toBe(true);
    });
  });

  describe("filterEmailsByAccount", () => {
    it("returns all emails for unified inbox", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-1" }),
        makeEmail({ id: "e2", accountId: "acc-2" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2" })];
      const result = filterEmailsByAccount(emails, accounts, { unified: true });
      expect(result).toHaveLength(2);
    });

    it("filters by specific account", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-1" }),
        makeEmail({ id: "e2", accountId: "acc-2" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2" })];
      const result = filterEmailsByAccount(emails, accounts, { unified: false, accountId: "acc-1" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("returns default account emails when no accountId specified", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-1" }),
        makeEmail({ id: "e2", accountId: "acc-2" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2", isDefault: false })];
      const result = filterEmailsByAccount(emails, accounts, { unified: false });
      expect(result).toHaveLength(1);
    });
  });

  describe("getEmailAccountBadge", () => {
    it("returns badge for known account", () => {
      const email = makeEmail({ accountId: "acc-1" });
      const accounts = [makeAccount()];
      const badge = getEmailAccountBadge(email, accounts);
      expect(badge).toEqual({ name: "Test", color: "#3b5bff" });
    });

    it("returns null for unknown account", () => {
      const email = makeEmail({ accountId: "unknown" });
      const accounts = [makeAccount()];
      expect(getEmailAccountBadge(email, accounts)).toBeNull();
    });

    it("returns null when email has no accountId", () => {
      const email = makeEmail({ accountId: undefined });
      const accounts = [makeAccount()];
      expect(getEmailAccountBadge(email, accounts)).toBeNull();
    });
  });

  describe("groupEmailsByAccount", () => {
    it("groups emails by account", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-1" }),
        makeEmail({ id: "e2", accountId: "acc-2" }),
        makeEmail({ id: "e3", accountId: "acc-1" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2" })];
      const groups = groupEmailsByAccount(emails, accounts);
      expect(groups).toHaveLength(2);
      expect(groups[0].emails).toHaveLength(2); // acc-1 (misfits first)
      expect(groups[1].emails).toHaveLength(1); // acc-2
    });

    it("puts misfits account first", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-2" }),
        makeEmail({ id: "e2", accountId: "acc-1" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2", provider: "gmail" })];
      const groups = groupEmailsByAccount(emails, accounts);
      expect(groups[0].account?.provider).toBe("misfits");
    });
  });

  describe("countEmailsPerAccount", () => {
    it("counts emails correctly", () => {
      const emails = [
        makeEmail({ id: "e1", accountId: "acc-1" }),
        makeEmail({ id: "e2", accountId: "acc-1" }),
        makeEmail({ id: "e3", accountId: "acc-2" }),
      ];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2" })];
      const counts = countEmailsPerAccount(emails, accounts);
      expect(counts.get("acc-1")).toBe(2);
      expect(counts.get("acc-2")).toBe(1);
    });

    it("initializes accounts with 0 count", () => {
      const emails: Email[] = [];
      const accounts = [makeAccount(), makeAccount({ id: "acc-2" })];
      const counts = countEmailsPerAccount(emails, accounts);
      expect(counts.get("acc-1")).toBe(0);
      expect(counts.get("acc-2")).toBe(0);
    });
  });

  describe("getProviderLabel", () => {
    it("returns label for Gmail", () => {
      expect(getProviderLabel("gmail")).toBe("Gmail");
    });

    it("returns label for misfits", () => {
      expect(getProviderLabel("misfits")).toBe("misfits.ai");
    });

    it("returns 'Custom IMAP' for custom", () => {
      expect(getProviderLabel("custom")).toBe("Custom IMAP");
    });
  });

  describe("isValidEmail", () => {
    it("validates correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    });

    it("rejects invalid emails", () => {
      expect(isValidEmail("not-an-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
    });
  });

  describe("getNextAccountColor", () => {
    it("returns first unused color", () => {
      const accounts = [makeAccount({ color: "#3b5bff" })];
      const nextColor = getNextAccountColor(accounts);
      expect(nextColor).not.toBe("#3b5bff");
    });

    it("cycles through colors", () => {
      const colors = ["#3b5bff", "#EA4335", "#0078D4", "#8B89CC", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
      const accounts = colors.map((c, i) => makeAccount({ id: `acc-${i}`, color: c }));
      const nextColor = getNextAccountColor(accounts);
      expect(nextColor).toBe(colors[0]); // Cycles back to first
    });
  });
});
