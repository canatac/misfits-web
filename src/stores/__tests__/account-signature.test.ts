import { describe, it, expect, beforeEach } from "vitest";
import { useAccountStore } from "@/stores/account-store";

const mem = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => mem.set(k, String(v)),
  removeItem: (k: string) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() { return mem.size; },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });

describe("Account Store — per-account signature (Issue #423)", () => {
  beforeEach(() => {
    mem.clear();
    useAccountStore.setState({
      accounts: [
        {
          id: "acc-1",
          email: "hermes@misfits.ai",
          name: "Hermes",
          provider: "misfits",
          color: "#3b5bff",
          avatar: "H",
          isDefault: true,
          aliases: [],
          connectedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeAccountId: "acc-1",
      isUnifiedInbox: false,
    });
  });

  it("sets a signature on an account", () => {
    const sig = "<strong>Hermes</strong><br/>misfits.ai";
    useAccountStore.getState().setAccountSignature("acc-1", sig);
    const account = useAccountStore.getState().getAccountById("acc-1");
    expect(account?.signature).toBe(sig);
  });

  it("clears a signature when set to undefined", () => {
    useAccountStore.getState().setAccountSignature("acc-1", "<b>Test</b>");
    useAccountStore.getState().setAccountSignature("acc-1", undefined);
    const account = useAccountStore.getState().getAccountById("acc-1");
    expect(account?.signature).toBeUndefined();
  });

  it("does not affect other accounts when setting signature", () => {
    useAccountStore.getState().addAccount({
      email: "work@company.com", name: "Work", provider: "gmail", color: "#ff0000",
    });
    useAccountStore.getState().setAccountSignature("acc-1", "<b>Sig1</b>");
    const acc2 = useAccountStore.getState().accounts.find((a) => a.email === "work@company.com");
    expect(acc2?.signature).toBeUndefined();
  });

  it("includes signature in state for persistence", () => {
    const sig = "<b>Persisted</b>";
    useAccountStore.getState().setAccountSignature("acc-1", sig);
    const state = useAccountStore.getState();
    expect(state.accounts[0].signature).toBe(sig);
  });

  it("updates signature via updateAccount", () => {
    const sig = "<b>Updated</b>";
    useAccountStore.getState().updateAccount("acc-1", { signature: sig });
    const account = useAccountStore.getState().getAccountById("acc-1");
    expect(account?.signature).toBe(sig);
  });

  it("getActiveAccount returns account with signature", () => {
    const sig = "<b>Active</b>";
    useAccountStore.getState().setAccountSignature("acc-1", sig);
    const active = useAccountStore.getState().getActiveAccount();
    expect(active?.signature).toBe(sig);
  });
});
