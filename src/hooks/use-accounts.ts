/**
 * Account data hooks using TanStack Query + the Zustand account store (Issue #154).
 *
 * useAccounts queries the store (with query caching), useAccountMutations wraps
 * the store mutations and invalidates the cache, and useUnifiedInbox is a typed
 * selector for the unified-inbox toggle.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccountStore } from "@/stores/account-store";
import type {
  AddAccountInput,
  UpdateAccountInput,
} from "@/stores/account-store";
import type { EmailAccount } from "@/types/account";

/** Query all connected accounts from the store. */
export function useAccounts() {
  return useQuery<EmailAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => useAccountStore.getState().accounts,
    staleTime: Infinity,
  });
}

/** Query the currently-active account. */
export function useActiveAccount() {
  return useQuery<EmailAccount | undefined>({
    queryKey: ["accounts", "active"],
    queryFn: () => useAccountStore.getState().getActiveAccount(),
    staleTime: Infinity,
  });
}

/** Query the default account. */
export function useDefaultAccount() {
  return useQuery<EmailAccount | undefined>({
    queryKey: ["accounts", "default"],
    queryFn: () => useAccountStore.getState().getDefaultAccount(),
    staleTime: Infinity,
  });
}

/** Selector hook for the unified-inbox toggle. */
export function useUnifiedInbox(): boolean {
  return useAccountStore((s) => s.isUnifiedInbox);
}

/** Selector hook for the active account id. */
export function useActiveAccountId(): string | null {
  return useAccountStore((s) => s.activeAccountId);
}

/** Mutations wrapping the store's add/remove/update actions. */
export function useAccountMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["accounts"] });

  const addAccount = useMutation<EmailAccount, Error, AddAccountInput>({
    mutationFn: (input) => {
      const account = useAccountStore.getState().addAccount(input);
      return Promise.resolve(account);
    },
    onSuccess: invalidate,
  });

  const removeAccount = useMutation<void, Error, string>({
    mutationFn: (id) => {
      useAccountStore.getState().removeAccount(id);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const updateAccount = useMutation<
    void,
    Error,
    { id: string; input: UpdateAccountInput }
  >({
    mutationFn: ({ id, input }) => {
      useAccountStore.getState().updateAccount(id, input);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const setDefaultAccount = useMutation<void, Error, string>({
    mutationFn: (id) => {
      useAccountStore.getState().setDefaultAccount(id);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const setActiveAccount = useMutation<void, Error, string>({
    mutationFn: (id) => {
      useAccountStore.getState().setActiveAccount(id);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const toggleUnifiedInbox = useMutation<void, Error, void>({
    mutationFn: () => {
      useAccountStore.getState().toggleUnifiedInbox();
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const addAlias = useMutation<void, Error, { id: string; alias: string }>({
    mutationFn: ({ id, alias }) => {
      useAccountStore.getState().addAlias(id, alias);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  return {
    addAccount,
    removeAccount,
    updateAccount,
    setDefaultAccount,
    setActiveAccount,
    toggleUnifiedInbox,
    addAlias,
  };
}
