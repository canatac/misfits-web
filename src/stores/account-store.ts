/**
 * Zustand store for multi-account management (Issue #154).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  EmailAccount,
  AccountProvider,
  AccountServerConfig,
} from "@/types/account";

const DEFAULT_ACCOUNTS: EmailAccount[] = [
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
];

function genId(): string {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface AddAccountInput {
  email: string;
  name?: string;
  provider: AccountProvider;
  color: string;
  avatar?: string;
  aliases?: string[];
  serverConfig?: AccountServerConfig;
}

export interface UpdateAccountInput {
  email?: string;
  name?: string;
  color?: string;
  avatar?: string;
  aliases?: string[];
  serverConfig?: AccountServerConfig;
  isDefault?: boolean;
  signature?: string;
}

interface AccountState {
  accounts: EmailAccount[];
  activeAccountId: string | null;
  isUnifiedInbox: boolean;
  getAccountById: (id: string) => EmailAccount | undefined;
  getActiveAccount: () => EmailAccount | undefined;
  getDefaultAccount: () => EmailAccount | undefined;
  getAccountIndex: (id: string) => number;
  addAccount: (input: AddAccountInput) => EmailAccount;
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string) => void;
  setDefaultAccount: (id: string) => void;
  toggleUnifiedInbox: () => void;
  setUnifiedInbox: (enabled: boolean) => void;
  updateAccount: (id: string, input: UpdateAccountInput) => void;
  addAlias: (id: string, alias: string) => void;
  setAccountSignature: (id: string, signature: string | undefined) => void;
  cycleActiveAccount: (direction: "next" | "prev") => void;
  setActiveAccountByIndex: (index: number) => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      activeAccountId: DEFAULT_ACCOUNTS[0].id,
      isUnifiedInbox: false,

      getAccountById: (id) => get().accounts.find((a) => a.id === id),
      getActiveAccount: () => {
        const { accounts, activeAccountId } = get();
        return accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
      },
      getDefaultAccount: () =>
        get().accounts.find((a) => a.isDefault) ?? get().accounts[0],
      getAccountIndex: (id) => get().accounts.findIndex((a) => a.id === id),

      addAccount: (input) => {
        const account: EmailAccount = {
          id: genId(),
          email: input.email.trim(),
          name: input.name?.trim() || input.email.split("@")[0],
          provider: input.provider,
          color: input.color,
          avatar: input.avatar,
          isDefault: false,
          aliases: input.aliases ?? [],
          serverConfig: input.serverConfig,
          connectedAt: new Date().toISOString(),
        };
        set((state) => ({
          accounts: [...state.accounts, account],
          activeAccountId: state.activeAccountId ?? account.id,
        }));
        return account;
      },

      removeAccount: (id) => {
        set((state) => {
          const accounts = state.accounts.filter((a) => a.id !== id);
          let activeAccountId = state.activeAccountId;
          let isUnifiedInbox = state.isUnifiedInbox;
          if (activeAccountId === id) {
            activeAccountId =
              accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id ?? null;
          }
          if (accounts.length <= 1) isUnifiedInbox = false;
          let nextAccounts = accounts;
          const removedWasDefault = !accounts.some((a) => a.isDefault);
          if (removedWasDefault && accounts.length > 0) {
            nextAccounts = accounts.map((a, i) =>
              i === 0 ? { ...a, isDefault: true } : a
            );
            activeAccountId = activeAccountId ?? nextAccounts[0].id;
          }
          return { accounts: nextAccounts, activeAccountId, isUnifiedInbox };
        });
      },

      setActiveAccount: (id) => {
        set((state) => {
          if (!state.accounts.some((a) => a.id === id)) return state;
          return { activeAccountId: id, isUnifiedInbox: false };
        });
      },

      setDefaultAccount: (id) => {
        set((state) => {
          if (!state.accounts.some((a) => a.id === id)) return state;
          return {
            accounts: state.accounts.map((a) => ({
              ...a,
              isDefault: a.id === id,
            })),
          };
        });
      },

      toggleUnifiedInbox: () => {
        set((state) => {
          if (state.accounts.length <= 1) return state;
          return { isUnifiedInbox: !state.isUnifiedInbox };
        });
      },

      setUnifiedInbox: (enabled) => {
        set((state) => {
          if (enabled && state.accounts.length <= 1) return state;
          return { isUnifiedInbox: enabled };
        });
      },

      updateAccount: (id, input) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...input,
                  email: input.email !== undefined ? input.email.trim() : a.email,
                  name: input.name !== undefined
                    ? input.name.trim() || a.email.split("@")[0]
                    : a.name,
                  aliases: input.aliases ?? a.aliases,
                }
              : a
          ),
        }));
        if (input.isDefault) get().setDefaultAccount(id);
      },

      addAlias: (id, alias) => {
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (a.id !== id) return a;
            const trimmed = alias.trim();
            if (!trimmed || a.aliases.includes(trimmed)) return a;
            return { ...a, aliases: [...a.aliases, trimmed] };
          }),
        }));
      },

      // --- Per-account signature (Issue #423) ---
      setAccountSignature: (id, signature) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, signature } : a
          ),
        }));
      },

      // --- Quick switching (Issue #445) ---
      cycleActiveAccount: (direction) => {
        const { accounts, activeAccountId } = get();
        if (accounts.length <= 1) return;
        const currentIdx = accounts.findIndex((a) => a.id === activeAccountId);
        if (currentIdx === -1) {
          const nextIdx = direction === "next" ? 0 : accounts.length - 1;
          set((state) => ({
            activeAccountId: accounts[nextIdx].id,
            isUnifiedInbox: false,
          }));
          return;
        }
        const delta = direction === "next" ? 1 : -1;
        const nextIdx = (currentIdx + delta + accounts.length) % accounts.length;
        set((state) => ({
          activeAccountId: accounts[nextIdx].id,
          isUnifiedInbox: false,
        }));
      },

      setActiveAccountByIndex: (index) => {
        const { accounts } = get();
        if (index < 0 || index >= accounts.length) return;
        set((state) => ({
          activeAccountId: accounts[index].id,
          isUnifiedInbox: false,
        }));
      },
    }),
    {
      name: "misfits-accounts",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        isUnifiedInbox: state.isUnifiedInbox,
      }),
    }
  )
);
