import type { AccountProvider, AccountServerConfig } from "@/types/account";
import { PROVIDER_PRESETS, type ValidationResult } from "@/lib/account-presets";

interface Params {
  provider: AccountProvider;
  email: string;
  password: string;
  name: string;
  serverConfig: AccountServerConfig;
  needsServerFields: boolean;
  color: string;
}

interface Callbacks {
  setTesting: (v: boolean) => void;
  setTestResult: (r: ValidationResult) => void;
  addAccount: (input: {
    email: string;
    name: string | undefined;
    provider: AccountProvider;
    color: string;
    avatar: undefined;
    aliases: never[];
    serverConfig: AccountServerConfig;
  }) => Promise<{ id: string }>;
  setActiveAccount: (id: string) => void;
  onDone: () => void;
}

/**
 * Backend save flow: creates external account, tests IMAP, starts sync, adds to store.
 * Extracted from add-account-modal.tsx for LOC compliance.
 */
export async function performSave(
  { provider, email, password, name, serverConfig, needsServerFields, color }: Params,
  cb: Callbacks
): Promise<void> {
  const effectiveServerConfig: AccountServerConfig = needsServerFields
    ? serverConfig
    : (PROVIDER_PRESETS[provider].serverConfig ?? serverConfig);

  let backendId: string | undefined;
  try {
    cb.setTesting(true);
    const {
      createExternalAccount,
      testExternalAccount,
      startExternalAccountSync,
      startOfTodayIso,
      toCreatePayload,
      deleteExternalAccount,
    } = await import("@/lib/external-accounts-api");

    const created = await createExternalAccount(
      toCreatePayload({
        email,
        provider,
        serverConfig: effectiveServerConfig,
        password,
      })
    );
    backendId = created.id;

    const test = await testExternalAccount(created.id);
    if (!test.ok) {
      try {
        await deleteExternalAccount(created.id);
      } catch {
        // noop
      }
      cb.setTestResult({
        ok: false,
        errors: [test.message || "IMAP test failed"],
      });
      return;
    }

    await startExternalAccountSync(created.id, {
      mode: "incremental",
      since: startOfTodayIso(),
    });
  } catch (err) {
    if (backendId) {
      try {
        const { deleteExternalAccount } = await import(
          "@/lib/external-accounts-api"
        );
        await deleteExternalAccount(backendId);
      } catch {
        // noop
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    cb.setTestResult({ ok: false, errors: [`Backend error: ${msg}`] });
    return;
  } finally {
    cb.setTesting(false);
  }

  const account = await cb.addAccount({
    email,
    name: name.trim() || undefined,
    provider,
    color,
    avatar: undefined,
    aliases: [],
    serverConfig: effectiveServerConfig,
  });
  cb.setActiveAccount(account.id);
  cb.onDone();
}
