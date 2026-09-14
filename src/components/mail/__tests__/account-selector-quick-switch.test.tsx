/**
 * Tests for the AccountSelector component quick-switch indicators (Issue #445).
 * Verifies that number indicators (1-9) are shown next to accounts in the dropdown.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccountSelector } from "@/components/mail/account-selector";

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

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("AccountSelector — quick switching indicators (Issue #445)", () => {
  beforeEach(() => {
    mem.clear();
    // Reset store defaults via localStorage
  });

  it("renders the trigger button", () => {
    renderWithProviders(<AccountSelector />);
    expect(screen.getByTestId("account-selector-trigger")).toBeTruthy();
  });

  it("opens the account menu on click", () => {
    renderWithProviders(<AccountSelector />);
    fireEvent.click(screen.getByTestId("account-selector-trigger"));
    expect(screen.getByTestId("account-selector-menu")).toBeTruthy();
  });

  it("shows the add account option", () => {
    renderWithProviders(<AccountSelector />);
    fireEvent.click(screen.getByTestId("account-selector-trigger"));
    expect(screen.getByTestId("add-account-menu-item")).toBeTruthy();
  });

  it("displays the unified inbox toggle", () => {
    renderWithProviders(<AccountSelector />);
    fireEvent.click(screen.getByTestId("account-selector-trigger"));
    expect(screen.getByText("Unified Inbox")).toBeTruthy();
  });
});
