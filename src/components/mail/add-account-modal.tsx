"use client";

/**
 * Add Account Modal — choose a provider, enter IMAP/SMTP + credentials,
 * pick an accent color, test connection, and save.
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
import { PROVIDER_PRESETS, validateConnection } from "@/lib/account-presets";
import { formReducer, initialFormState } from "./parts/add-account-modal/form-reducer";
import { performSave } from "./parts/add-account-modal/save-flow";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    await performSave(
      { provider, email, password, name, serverConfig, needsServerFields, color: activeColor },
      {
        setTesting: (v) => dispatch({ type: "setTesting", testing: v }),
        setTestResult: (r) => dispatch({ type: "setTestResult", testResult: r }),
        addAccount: (input) => addAccount.mutateAsync(input),
        setActiveAccount,
        onDone: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const canSave =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;

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
            <div className="grid gap-2">
              <Label htmlFor="account-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) =>
                  dispatch({ type: "setProvider", provider: v as AccountProvider })
                }
              >
                <SelectTrigger id="account-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_PRESETS) as AccountProvider[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_PRESETS[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="account-email">Email address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => dispatch({ type: "setEmail", email: e.target.value })}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-name">Display name (optional)</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
                  placeholder="Work, Personal…"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account-password">Password / App password</Label>
              <Input
                id="account-password"
                type="password"
                value={password}
                onChange={(e) => dispatch({ type: "setPassword", password: e.target.value })}
                placeholder="••••••••••••"
              />
              <p className="text-xs text-[var(--color-muted-fg)]">
                Use an app-specific password for providers that require 2FA.
              </p>
            </div>

            {needsServerFields && (
              <ServerSettingsFields
                serverConfig={serverConfig}
                setServerConfig={(update) =>
                  dispatch({
                    type: "setServerConfig",
                    serverConfig:
                      typeof update === "function"
                        ? (update as (s: AccountServerConfig) => AccountServerConfig)(serverConfig)
                        : update,
                  })
                }
              />
            )}

            <AccountColorPicker
              color={color}
              customColor={customColor}
              onSelectColor={(c) => dispatch({ type: "setColor", color: c })}
              onCustomColorChange={(c) => dispatch({ type: "setCustomColor", customColor: c })}
              accountsCount={accounts.length}
            />

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

            <TestResultBanner testResult={testResult} />
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !canSave}
            data-testid="test-connection-button"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Test connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || addAccount.isPending}
            data-testid="save-account-button"
          >
            {addAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Add account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
