import type {
  LoginResponse,
  Session,
  TwoFactorRequiredResponse,
} from "@/types/auth";
import {
  audit,
  detectConcurrentSession,
  recordSessionId,
  storeSession,
} from "@/lib/session";
import { useAccountStore } from "@/stores/account-store";
import type { AuthStore } from "./types";

export function applySession(
  set: (partial: Partial<AuthStore>) => void,
  session: Session,
  remember: boolean
): void {
  recordSessionId(session.id);
  storeSession(session, remember);
  const concurrent = detectConcurrentSession(session.id);
  if (concurrent) {
    audit("session_replaced", "Another session detected for this account.");
  }
  set({
    user: session.user,
    session,
    isAuthenticated: true,
    error: null,
    pendingTwoFactorChallengeId: null,
    isLoading: false,
  });

  const accountStore = useAccountStore.getState();
  const { accounts, updateAccount, removeAccount } = accountStore;
  const primary =
    accounts.find((a: { isDefault: boolean }) => a.isDefault) ?? accounts[0];
  if (primary) {
    updateAccount(primary.id, {
      email: session.user.email,
      name: session.user.displayName ?? session.user.email.split("@")[0],
    });
  }
  accounts
    .filter((a: { id: string }) => a.id !== primary?.id)
    .forEach((a: { id: string }) => removeAccount(a.id));
}

export function isTwoFactorChallenge(
  res: LoginResponse
): res is TwoFactorRequiredResponse {
  return (
    typeof (res as TwoFactorRequiredResponse).twoFactorRequired === "boolean" &&
    (res as TwoFactorRequiredResponse).twoFactorRequired === true
  );
}
