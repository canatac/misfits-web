/**
 * Quick account switch (Issue #445).
 */

export interface Account {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  unreadCount: number;
  isActive: boolean;
}

export interface AccountSwitchState {
  isOpen: boolean;
  accounts: Account[];
  selectedIndex: number;
  query: string;
}

export interface AccountSwitchOptions {
  maxDisplay?: number;
  shortcutKey?: string;
  onSelect?: (account: Account) => void;
  onClose?: () => void;
}

export const DEFAULT_SWITCH_OPTIONS: Required<Pick<AccountSwitchOptions, "maxDisplay" | "shortcutKey">> = {
  maxDisplay: 9,
  shortcutKey: "g",
};

export function createInitialSwitchState(accounts: Account[] = []): AccountSwitchState {
  return { isOpen: false, accounts, selectedIndex: 0, query: "" };
}

export function filterAccounts(accounts: Account[], query: string): Account[] {
  if (!query) return accounts.slice(0, DEFAULT_SWITCH_OPTIONS.maxDisplay);
  const lowerQuery = query.toLowerCase();
  return accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(lowerQuery) ||
      account.email.toLowerCase().includes(lowerQuery),
  );
}

export function getActiveAccount(accounts: Account[]): Account | null {
  return accounts.find((a) => a.isActive) || null;
}

export function getTotalUnread(accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + acc.unreadCount, 0);
}

export function switchToAccount(accounts: Account[], index: number): { switched: boolean; account: Account | null } {
  if (index < 0 || index >= accounts.length) return { switched: false, account: null };
  return { switched: true, account: accounts[index] };
}

export function parseAccountShortcut(key: string, gPressed: boolean): { isSwitchShortcut: boolean; accountIndex: number | null } {
  if (gPressed && key === "a") return { isSwitchShortcut: true, accountIndex: null };
  const num = parseInt(key, 10);
  if (!isNaN(num) && num >= 1 && num <= 9) return { isSwitchShortcut: true, accountIndex: num - 1 };
  return { isSwitchShortcut: false, accountIndex: null };
}

export function formatUnreadCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

export function sortAccountsForDisplay(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return b.unreadCount - a.unreadCount;
  });
}
