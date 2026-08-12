/**
 * Regression: clicking folder items (Inbox, Sent, etc.) from non-/mail routes
 * must navigate to /mail, otherwise the click appears to do nothing.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MailSidebar } from "@/components/mail/sidebar";

let pathname = "/dashboard";
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Minimal localStorage polyfill for zustand/persist
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

describe("MailSidebar folder navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    mem.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ emails: [], total: 0 }),
      } as Response)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigates to /mail when Inbox is clicked outside /mail", async () => {
    pathname = "/dashboard";

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <MailSidebar />
      </QueryClientProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Inbox/i }));
      await Promise.resolve();
    });
    expect(push).toHaveBeenCalledWith("/mail");
  });

  it("does not force navigation when already on /mail", async () => {
    pathname = "/mail";

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <MailSidebar />
      </QueryClientProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Inbox/i }));
      await Promise.resolve();
    });
    expect(push).not.toHaveBeenCalled();
  });
});
