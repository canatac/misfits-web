import { describe, it, expect } from "vitest";
import {
  DEFAULT_SWITCH_OPTIONS,
  Account,
  createInitialSwitchState,
  filterAccounts,
  formatUnreadCount,
  getActiveAccount,
  getTotalUnread,
  parseAccountShortcut,
  sortAccountsForDisplay,
  switchToAccount,
} from "@/lib/account-switch";

const mockAccounts: Account[] = [
  { id: "1", name: "Work", email: "work@example.com", unreadCount: 5, isActive: true },
  { id: "2", name: "Personal", email: "personal@example.com", unreadCount: 12, isActive: false },
  { id: "3", name: "Side", email: "side@example.com", unreadCount: 0, isActive: false },
];

describe("createInitialSwitchState", () => {
  it("creates state with accounts", () => {
    const state = createInitialSwitchState(mockAccounts);
    expect(state.isOpen).toBe(false);
    expect(state.accounts).toEqual(mockAccounts);
  });
});

describe("filterAccounts", () => {
  it("returns all accounts when no query", () => {
    expect(filterAccounts(mockAccounts, "")).toHaveLength(3);
  });
  it("filters by name", () => {
    const result = filterAccounts(mockAccounts, "work");
    expect(result).toHaveLength(1);
  });
});

describe("getActiveAccount", () => {
  it("returns the active account", () => {
    expect(getActiveAccount(mockAccounts)?.name).toBe("Work");
  });
});

describe("getTotalUnread", () => {
  it("sums unread counts", () => {
    expect(getTotalUnread(mockAccounts)).toBe(17);
  });
});

describe("switchToAccount", () => {
  it("switches to valid index", () => {
    expect(switchToAccount(mockAccounts, 1).account?.name).toBe("Personal");
  });
});

describe("parseAccountShortcut", () => {
  it("detects g+a shortcut", () => {
    expect(parseAccountShortcut("a", true).isSwitchShortcut).toBe(true);
  });
  it("detects number keys 1-9", () => {
    expect(parseAccountShortcut("3", false).accountIndex).toBe(2);
  });
});

describe("formatUnreadCount", () => {
  it("returns empty string for zero", () => {
    expect(formatUnreadCount(0)).toBe("");
  });
  it("caps at 99+", () => {
    expect(formatUnreadCount(150)).toBe("99+");
  });
});

describe("sortAccountsForDisplay", () => {
  it("puts active account first", () => {
    expect(sortAccountsForDisplay(mockAccounts)[0].isActive).toBe(true);
  });
});
