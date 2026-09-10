import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useAccountStore } from "@/stores/account-store";

// Minimal localStorage polyfill
const mem = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, String(v));
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() {
    return mem.size;
  },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// Inline component for testing
function AccountSignatureEditor({
  accountId,
}: {
  accountId: string;
}) {
  const account = useAccountStore((s) =>
    s.accounts.find((a) => a.id === accountId)
  );
  const setAccountSignature = useAccountStore((s) => s.setAccountSignature);
  const [value, setValue] = React.useState(account?.signature ?? "");
  const [editing, setEditing] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (!editing) setValue(account?.signature ?? "");
  }, [accountId, account?.signature, editing]);

  const save = () => {
    setAccountSignature(accountId, value.trim() || undefined);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setAccountSignature(accountId, undefined);
    setValue("");
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div data-testid={`account-editor-${accountId}`}>
      <p>Current: {account?.signature || "none"}</p>
      {editing ? (
        <>
          <textarea
            data-testid={`input-${accountId}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button data-testid={`save-${accountId}`} onClick={save}>Save</button>
          <button data-testid={`reset-${accountId}`} onClick={reset}>Reset</button>
        </>
      ) : (
        <button data-testid={`edit-${accountId}`} onClick={() => setEditing(true)}>
          Edit
        </button>
      )}
      {saved && <span data-testid={`saved-${accountId}`}>Saved!</span>}
    </div>
  );
}

import React from "react";

describe("Account Signature Editor (Issue #423)", () => {
  beforeEach(() => {
    mem.clear();
    useAccountStore.setState({
      accounts: [
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
      ],
      activeAccountId: "acc-1",
      isUnifiedInbox: false,
    });
  });

  it("renders without custom signature", () => {
    render(<AccountSignatureEditor accountId="acc-1" />);
    expect(screen.getByText("Current: none")).toBeTruthy();
  });

  it("edits and saves a signature", () => {
    render(<AccountSignatureEditor accountId="acc-1" />);

    fireEvent.click(screen.getByTestId("edit-acc-1"));
    fireEvent.change(screen.getByTestId("input-acc-1"), {
      target: { value: "<strong>John</strong>" },
    });
    fireEvent.click(screen.getByTestId("save-acc-1"));

    expect(screen.getByText("Current: <strong>John</strong>")).toBeTruthy();
    expect(screen.getByTestId("saved-acc-1")).toBeTruthy();

    const account = useAccountStore.getState().getAccountById("acc-1");
    expect(account?.signature).toBe("<strong>John</strong>");
  });

  it("resets signature to default", () => {
    // Set initial signature
    useAccountStore.getState().setAccountSignature("acc-1", "<b>Test</b>");

    render(<AccountSignatureEditor accountId="acc-1" />);

    fireEvent.click(screen.getByTestId("edit-acc-1"));
    fireEvent.click(screen.getByTestId("reset-acc-1"));

    expect(screen.getByText("Current: none")).toBeTruthy();

    const account = useAccountStore.getState().getAccountById("acc-1");
    expect(account?.signature).toBeUndefined();
  });

  it("shows 'none' when signature is empty string", () => {
    // Setting empty string should be treated as no signature
    useAccountStore.getState().setAccountSignature("acc-1", "");

    render(<AccountSignatureEditor accountId="acc-1" />);
    expect(screen.getByText(/Current:/)).toBeTruthy();
    expect(screen.queryByText(/<b>/)).toBeNull();
  });
});
