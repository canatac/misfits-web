/**
 * Tests for quick account switching methods added in Issue #445.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAccountStore } from "@/stores/account-store";

const mem = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() {
    return mem.size;
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

describe("AccountStore — quick switching (Issue #445)", () => {
  beforeEach(() => {
    mem.clear();
    // Reset store to defaults
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
        {
          id: "acc-2",
          email: "alice@example.com",
          name: "Alice",
          provider: "gmail",
          color: "#10b981",
          avatar: undefined,
          isDefault: false,
          aliases: [],
          connectedAt: "2025-02-01T00:00:00.000Z",
        },
        {
          id: "acc-3",
          email: "bob@example.com",
          name: "Bob",
          provider: "outlook",
          color: "#f59e0b",
          avatar: undefined,
          isDefault: false,
          aliases: [],
          connectedAt: "2025-03-01T00:00:00.000Z",
        },
      ],
      activeAccountId: "acc-1",
      isUnifiedInbox: false,
    });
  });

  it("getAccountIndex returns the correct index", () => {
    expect(useAccountStore.getState().getAccountIndex("acc-1")).toBe(0);
    expect(useAccountStore.getState().getAccountIndex("acc-2")).toBe(1);
    expect(useAccountStore.getState().getAccountIndex("acc-3")).toBe(2);
    expect(useAccountStore.getState().getAccountIndex("nonexistent")).toBe(-1);
  });

  it("cycleActiveAccount('next') moves to next account with wrap-around", () => {
    // Start at acc-1, next -> acc-2
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-2");

    // acc-2 -> acc-3
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-3");

    // acc-3 -> acc-1 (wrap around)
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");
  });

  it("cycleActiveAccount('prev') moves to previous account with wrap-around", () => {
    // Start at acc-1, prev -> acc-3 (wrap backwards)
    useAccountStore.getState().cycleActiveAccount("prev");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-3");

    // acc-3 -> acc-2
    useAccountStore.getState().cycleActiveAccount("prev");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-2");

    // acc-2 -> acc-1
    useAccountStore.getState().cycleActiveAccount("prev");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");
  });

  it("cycleActiveAccount exits unified inbox mode", () => {
    useAccountStore.setState({ isUnifiedInbox: true });
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().isUnifiedInbox).toBe(false);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-2");
  });

  it("cycleActiveAccount is a no-op with 0 or 1 accounts", () => {
    useAccountStore.setState({
      accounts: [
        {
          id: "acc-only",
          email: "only@example.com",
          name: "Only",
          provider: "custom",
          color: "#3b5bff",
          isDefault: true,
          aliases: [],
          connectedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeAccountId: "acc-only",
    });
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-only");
  });

  it("setActiveAccountByIndex sets the correct account by index", () => {
    useAccountStore.getState().setActiveAccountByIndex(1);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-2");

    useAccountStore.getState().setActiveAccountByIndex(2);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-3");
  });

  it("setActiveAccountByIndex does nothing for out-of-range indices", () => {
    useAccountStore.getState().setActiveAccountByIndex(-1);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");

    useAccountStore.getState().setActiveAccountByIndex(99);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");
  });

  it("setActiveAccountByIndex exits unified inbox mode", () => {
    useAccountStore.setState({ isUnifiedInbox: true });
    useAccountStore.getState().setActiveAccountByIndex(0);
    expect(useAccountStore.getState().isUnifiedInbox).toBe(false);
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");
  });

  it("handles cycling when active account is not in the list", () => {
    useAccountStore.setState({ activeAccountId: "nonexistent" });
    // Should start from first account
    useAccountStore.getState().cycleActiveAccount("next");
    expect(useAccountStore.getState().activeAccountId).toBe("acc-1");
  });
});
