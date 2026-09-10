/**
 * Quick account switch (Issue #445).
 *
 * Keyboard shortcut 'g' then 'a' opens overlay with account list
 * and number keys (1-9) for instant switching.
 */

export interface AccountSwitchItem {
  id: string;
  name: string;
  email: string;
  unreadCount: number;
  isActive: boolean;
  color?: string;
}

export interface AccountSwitchState {
  isOpen: boolean;
  accounts: AccountSwitchItem[];
  activeAccountId: string | null;
}

export interface AccountSwitchAction {
  type: "OPEN" | "CLOSE" | "SWITCH" | "SET_ACTIVE";
  payload?: { accountId?: string; accounts?: AccountSwitchItem[] };
}

export const initialState: AccountSwitchState = {
  isOpen: false,
  accounts: [],
  activeAccountId: null,
};

/**
 * Reducer for account switch state.
 */
export function accountSwitchReducer(
  state: AccountSwitchState,
  action: AccountSwitchAction
): AccountSwitchState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "SWITCH":
      return {
        ...state,
        activeAccountId: action.payload?.accountId ?? state.activeAccountId,
        isOpen: false,
      };
    case "SET_ACTIVE":
      return {
        ...state,
        activeAccountId: action.payload?.accountId ?? state.activeAccountId,
      };
    default:
      return state;
  }
}

/**
 * Open account switch overlay.
 */
export function openAccountSwitch(): AccountSwitchAction {
  return { type: "OPEN" };
}

/**
 * Close account switch overlay.
 */
export function closeAccountSwitch(): AccountSwitchAction {
  return { type: "CLOSE" };
}

/**
 * Switch to account by ID.
 */
export function switchToAccount(accountId: string): AccountSwitchAction {
  return { type: "SWITCH", payload: { accountId } };
}

/**
 * Switch to account by number key (1-9).
 */
export function switchByNumberKey(
  state: AccountSwitchState,
  key: string
): AccountSwitchAction | null {
  const index = parseInt(key, 10) - 1;
  if (index >= 0 && index < state.accounts.length) {
    return switchToAccount(state.accounts[index].id);
  }
  return null;
}

/**
 * Get active account.
 */
export function getActiveAccount(
  state: AccountSwitchState
): AccountSwitchItem | null {
  return state.accounts.find((a) => a.id === state.activeAccountId) ?? null;
}

/**
 * Check if overlay is open.
 */
export function isAccountSwitchOpen(state: AccountSwitchState): boolean {
  return state.isOpen;
}

/**
 * Get total unread count across all accounts.
 */
export function getTotalUnreadCount(state: AccountSwitchState): number {
  return state.accounts.reduce((sum, a) => sum + a.unreadCount, 0);
}

/**
 * Get account by number key index.
 */
export function getAccountByNumber(
  state: AccountSwitchState,
  number: number
): AccountSwitchItem | null {
  return state.accounts[number - 1] ?? null;
}

/**
 * Check if account is active.
 */
export function isAccountActive(
  state: AccountSwitchState,
  accountId: string
): boolean {
  return state.activeAccountId === accountId;
}
