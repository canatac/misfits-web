/**
 * Integration test: External accounts API cross-repo contract.
 *
 * Cross-repo contract: external-accounts-api.ts wraps apiClient to call
 * backend (reimagined-guide) for IMAP account management.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  loadSession: vi.fn().mockReturnValue({ user: { email: "test@misfits.fr" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("External accounts API contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "acc-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("createExternalAccount POSTs to /external-accounts", async () => {
    const { createExternalAccount } = await import("@/lib/external-accounts-api");
    await createExternalAccount({
      provider: "gmail",
      email: "test@gmail.com",
      authType: "password",
      imap: { host: "imap.gmail.com", port: 993, tls: true },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/external-accounts"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("testExternalAccount POSTs to /external-accounts/{id}/test", async () => {
    const { testExternalAccount } = await import("@/lib/external-accounts-api");
    await testExternalAccount("acc-123");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/external-accounts/${encodeURIComponent("acc-123")}/test`),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("startExternalAccountSync POSTs to /external-accounts/{id}/sync", async () => {
    const { startExternalAccountSync } = await import("@/lib/external-accounts-api");
    await startExternalAccountSync("acc-456", { mode: "incremental" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/external-accounts/${encodeURIComponent("acc-456")}/sync`),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deleteExternalAccount DELETEs /external-accounts/{id}", async () => {
    const { deleteExternalAccount } = await import("@/lib/external-accounts-api");
    await deleteExternalAccount("acc-789");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/external-accounts/${encodeURIComponent("acc-789")}`),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("toCreatePayload maps UI config to backend shape", async () => {
    const { toCreatePayload } = await import("@/lib/external-accounts-api");

    const payload = toCreatePayload({
      email: "test@gmail.com",
      provider: "gmail",
      serverConfig: {
        imapHost: "imap.gmail.com",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpSecurity: "starttls",
      },
      password: "secret",
    });

    expect(payload.imap.host).toBe("imap.gmail.com");
    expect(payload.imap.port).toBe(993);
    expect(payload.imap.tls).toBe(true);
    expect(payload.smtp?.host).toBe("smtp.gmail.com");
    expect(payload.credentials?.secretValue).toBe("secret");
  });

  it("startOfTodayIso returns midnight ISO", async () => {
    const { startOfTodayIso } = await import("@/lib/external-accounts-api");
    const iso = startOfTodayIso();
    expect(iso).toMatch(/T00:00:00.000Z$/);
  });
});
