"use client";

/**
 * Add Account Modal — choose a provider (Gmail/Outlook/Proton/Custom), enter
 * IMAP/SMTP server settings and credentials, pick an accent color, and test the
 * connection before saving (Issue #154).
 *
 * The "Test connection" action performs real client-side validation of the
 * server config and credentials (no fabricated network round-trip). On success
 * the account is added to the store.
 */
import * as React from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAccountMutations } from "@/hooks/use-accounts";
import { useAccountStore } from "@/stores/account-store";
import { ImapConsole } from "@/components/mail/imap-console";
import type { AccountProvider, AccountServerConfig } from "@/types/account";
import {
  AccountColorPicker,
  TestResultBanner,
} from "./add-account-modal/account-color-picker";
import { ServerSettingsFields } from "./add-account-modal/server-settings-fields";

/** Accent color presets for accounts. */
import {
  ACCOUNT_COLORS,
  PROVIDER_PRESETS,
  validateConnection,
  type ValidationResult,
} from "@/lib/account-presets";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Reducer — consolidates the account creation form + test session state.    */
/* -------------------------------------------------------------------------- */

interface FormState {
  provider: AccountProvider;
  email: string;
  name: string;
  password: string;
  color: string;
  customColor: string;
  serverConfig: AccountServerConfig;
  testing: boolean;
  testResult: ValidationResult | null;
}

type FormAction =
  | { type: "setProvider"; provider: AccountProvider }
  | { type: "setEmail"; email: string }
  | { type: "setName"; name: string }
  | { type: "setPassword"; password: string }
  | { type: "setColor"; color: string }
  | { type: "setCustomColor"; customColor: string }
  | { type: "setServerConfig"; serverConfig: AccountServerConfig }
  | { type: "setTesting"; testing: boolean }
  | { type: "setTestResult"; testResult: ValidationResult | null }
  | { type: "startTest" }
  | { type: "reset" };

const initialFormState: FormState = {
  provider: "gmail",
  email: "",
  name: "",
  password: "",
  color: ACCOUNT_COLORS[0],
  customColor: "",
  serverConfig: PROVIDER_PRESETS.gmail.serverConfig!,
  testing: false,
  testResult: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setProvider": {
      const preset = PROVIDER_PRESETS[action.provider];
      return {
        ...state,
        provider: action.provider,
        serverConfig: preset.serverConfig
          ? { ...preset.serverConfig }
          : state.serverConfig,
        testResult: null,
      };
    }
    case "setEmail":
      return { ...state, email: action.email, testResult: null };
    case "setName":
      return { ...state, name: action.name };
    case "setPassword":
      return { ...state, password: action.password, testResult: null };
    case "setColor":
      return { ...state, color: action.color, customColor: "" };
    case "setCustomColor":
      return { ...state, customColor: action.customColor };
    case "setServerConfig":
      return { ...state, serverConfig: action.serverConfig };
    case "setTesting":
      return { ...state, testing: action.testing };
    case "setTestResult":
      return { ...state, testResult: action.testResult };
    case "startTest":
      return { ...state, testing: true, testResult: null };
    case "reset":
      return initialFormState;
    default:
      return state;
  }
}

type ProbeInput = {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
};

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { addAccount } = useAccountMutations();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);

  const [state, dispatch] = React.useReducer(formReducer, initialFormState);
  const {
    provider,
    email,
    name,
    password,
    color,
    customColor,
    serverConfig,
    testing,
    testResult,
  } = state;

  const [probeInput, setProbeInput] = React.useState<ProbeInput | null>(null);

  const activeColor = customColor || color;
  const needsServerFields = PROVIDER_PRESETS[provider].needsServerFields;

  function reset() {
    dispatch({ type: "reset" });
    setProbeInput(null);
  }

  function handleProviderChange(next: AccountProvider) {
    dispatch({ type: "setProvider", provider: next });
  }

  function handleTestConnection() {
    dispatch({ type: "startTest" });
    const result = validateConnection(email, password, serverConfig);
    if (!result.ok) {
      dispatch({ type: "setTestResult", testResult: result });
      dispatch({ type: "setTesting", testing: false });
      return;
    }
    setProbeInput({
      host: serverConfig.imapHost,
      port: serverConfig.imapPort,
      tls: serverConfig.imapSecurity !== "none",
      username: email,
      password,
    });
  }

  async function handleSave() {
    const result = validateConnection(email, password, serverConfig);
    if (!result.ok) {
      dispatch({ type: "setTestResult", testResult: result });
      return;
    }

    const effectiveServerConfig: AccountServerConfig = needsServerFields
      ? serverConfig
      : (PROVIDER_PRESETS[provider].serverConfig ?? serverConfig);

    let backendId: string | undefined;
    try {
      dispatch({ type: "setTesting", testing: true });
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
        dispatch({
          type: "setTestResult",
          testResult: { ok: false, errors: [test.message || "IMAP test failed"] },
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
      dispatch({
        type: "setTestResult",
        testResult: { ok: false, errors: [`Backend error: ${msg}`] },
      });
      return;
    } finally {
      dispatch({ type: "setTesting", testing: false });
    }

    const account = await addAccount.mutateAsync({
      email,
      name: name.trim() || undefined,
      provider,
      color: activeColor,
      avatar: undefined,
      aliases: [],
      serverConfig: effectiveServerConfig,
    });
    setActiveAccount(account.id);
    reset();
    onOpenChange(false);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const canSave =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;
  const showServerFields = needsServerFields;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--color-brand-500)]" />
            Add email account
          </ModalTitle>
          <ModalDescription>
            Connect a new mailbox. Choose a provider or use custom IMAP/SMTP
            settings.
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4">
            {/* Provider */}
            <div className="grid gap-2">
              <Label htmlFor="account-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) =>
                  handleProviderChange(v as AccountProvider)
                }
              >
                <SelectTrigger id="account-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_PRESETS) as AccountProvider[]).map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {PROVIDER_PRESETS[p].label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Email + Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="account-email">Email address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    dispatch({ type: "setEmail", email: e.target.value })
                  }
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-name">Display name (optional)</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) =>
                    dispatch({ type: "setName", name: e.target.value })
                  }
                  placeholder="Work, Personal…"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="account-password">Password / App password</Label>
              <Input
                id="account-password"
                type="password"
                value={password}
                onChange={(e) =>
                  dispatch({ type: "setPassword", password: e.target.value })
                }
                placeholder="••••••••••••"
              />
              <p className="text-xs text-[var(--color-muted-fg)]">
                Use an app-specific password for providers that require 2FA.
              </p>
            </div>

            {/* Server settings (only for custom provider) */}
            {showServerFields && (
              <ServerSettingsFields
                serverConfig={serverConfig}
                setServerConfig={(update) =>
                  dispatch({
                    type: "setServerConfig",
                    serverConfig:
                      typeof update === "function"
                        ? (update as (
                            s: AccountServerConfig
                          ) => AccountServerConfig)(serverConfig)
                        : update,
                  })
                }
              />
            )}

            {/* Color picker */}
            <AccountColorPicker
              color={color}
              customColor={customColor}
              onSelectColor={(c) => dispatch({ type: "setColor", color: c })}
              onCustomColorChange={(c) =>
                dispatch({ type: "setCustomColor", customColor: c })
              }
              accountsCount={accounts.length}
            />

            {/* Live IMAP console (shows every request/response during test) */}
            <ImapConsole
              input={probeInput}
              onDone={(r) => {
                dispatch({ type: "setTesting", testing: false });
                dispatch({
                  type: "setTestResult",
                  testResult: r.ok
                    ? { ok: true, errors: [] }
                    : { ok: false, errors: [r.error ?? "IMAP probe failed"] },
                });
              }}
              title="IMAP session"
            />

            {/* Test connection result */}
            <TestResultBanner testResult={testResult} />
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !canSave}
            data-testid="test-connection-button"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Test connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || addAccount.isPending}
            data-testid="save-account-button"
          >
            {addAccount.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Add account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
