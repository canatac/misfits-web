/**
 * Unit tests for account switch.
 */
import { describe, it, expect } from "vitest";
import {
  accountSwitchReducer,
  initialState,
  openAccountSwitch,
  closeAccountSwitch,
  switchToAccount,
  switchByNumberKey,
  getActiveAccount,
  isAccountSwitchOpen,
  getTotalUnreadCount,
  getAccountByNumber,
  isAccountActive,
} from "@/lib/account-switch";

const SAMPLE_ACCOUNTS = [
  { id: "a1", name: "Work", email: "work@example.com", unreadCount: 5, isActive: true, color: "#C49B66" },
  { id: "a2", name: "Personal", email: "personal@example.com", unreadCount: 3, isActive: false, color: "#666" },
  { id: "a3", name: "Side", email: "side@example.com", unreadCount: 0, isActive: false, color: "#999" },
];

describe("account-switch", () => {
  describe("accountSwitchReducer", () => {
    it("handles OPEN action", () => {
      const state = accountSwitchReducer(initialState, openAccountSwitch());
      expect(state.isOpen).toBe(true);
    });

    it("handles CLOSE action", () => {
      let state = accountSwitchReducer(initialState, openAccountSwitch());
      state = accountSwitchReducer(state, closeAccountSwitch());
      expect(state.isOpen).toBe(false);
    });

    it("handles SWITCH action", () => {
      const state = accountSwitchReducer(
        { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" },
        switchToAccount("a2")
      );
      expect(state.activeAccountId).toBe("a2");
      expect(state.isOpen).toBe(false);
    });
  });

  describe("openAccountSwitch", () => {
    it("creates open action", () => {
      const action = openAccountSwitch();
      expect(action.type).toBe("OPEN");
    });
  });

  describe("closeAccountSwitch", () => {
    it("creates close action", () => {
      const action = closeAccountSwitch();
      expect(action.type).toBe("CLOSE");
    });
  });

  describe("switchToAccount", () => {
    it("creates switch action", () => {
      const action = switchToAccount("a1");
      expect(action.type).toBe("SWITCH");
      expect(action.payload?.accountId).toBe("a1");
    });
  });

  describe("switchByNumberKey", () => {
    it("switches to first account on '1'", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const action = switchByNumberKey(state, "1");
      expect(action?.payload?.accountId).toBe("a1");
    });

    it("switches to second account on '2'", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const action = switchByNumberKey(state, "2");
      expect(action?.payload?.accountId).toBe("a2");
    });

    it("returns null for invalid key", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const action = switchByNumberKey(state, "9");
      expect(action).toBeNull();
    });
  });

  describe("getActiveAccount", () => {
    it("returns active account", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const account = getActiveAccount(state);
      expect(account?.id).toBe("a1");
    });

    it("returns null when no active", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: null };
      const account = getActiveAccount(state);
      expect(account).toBeNull();
    });
  });

  describe("isAccountSwitchOpen", () => {
    it("returns false initially", () => {
      expect(isAccountSwitchOpen(initialState)).toBe(false);
    });

    it("returns true when open", () => {
      const state = accountSwitchReducer(initialState, openAccountSwitch());
      expect(isAccountSwitchOpen(state)).toBe(true);
    });
  });

  describe("getTotalUnreadCount", () => {
    it("returns total unread", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      expect(getTotalUnreadCount(state)).toBe(8);
    });
  });

  describe("getAccountByNumber", () => {
    it("returns account by number", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const account = getAccountByNumber(state, 1);
      expect(account?.id).toBe("a1");
    });

    it("returns null for invalid number", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      const account = getAccountByNumber(state, 9);
      expect(account).toBeNull();
    });
  });

  describe("isAccountActive", () => {
    it("returns true for active account", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      expect(isAccountActive(state, "a1")).toBe(true);
    });

    it("returns false for inactive account", () => {
      const state = { ...initialState, accounts: SAMPLE_ACCOUNTS, activeAccountId: "a1" };
      expect(isAccountActive(state, "a2")).toBe(false);
    });
  });
});
