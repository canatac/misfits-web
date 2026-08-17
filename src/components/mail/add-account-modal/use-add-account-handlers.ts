"use client";
import * as React from "react";
import type { AccountServerConfig } from "@/types/account";
import { validateConnection } from "@/lib/account-presets";
import { performSave } from "../parts/add-account-modal/save-flow";
import type { formReducer } from "../parts/add-account-modal/form-reducer";

type ProbeInput = {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
};

type Dispatch = React.Dispatch<Parameters<typeof formReducer>[1]>;

interface Params {
  state: {
    provider: ReturnType<typeof formReducer>["provider"];
    email: string;
    name: string;
    password: string;
    serverConfig: AccountServerConfig;
    activeColor: string;
    needsServerFields: boolean;
  };
  dispatch: Dispatch;
  setProbeInput: (v: ProbeInput | null) => void;
  addAccountMutate: (input: Parameters<Parameters<typeof performSave>[1]["addAccount"]>[0]) => Promise<{ id: string }>;
  setActiveAccount: (id: string) => void;
  onOpenChange: (v: boolean) => void;
}

/**
 * Handlers for the Add Account modal: reset, test, save, close.
 */
export function useAddAccountHandlers({
  state,
  dispatch,
  setProbeInput,
  addAccountMutate,
  setActiveAccount,
  onOpenChange,
}: Params) {
  const { provider, email, name, password, serverConfig, activeColor, needsServerFields } = state;

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
        addAccount: (input) => addAccountMutate(input),
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

  return { reset, handleTestConnection, handleSave, handleClose };
}
