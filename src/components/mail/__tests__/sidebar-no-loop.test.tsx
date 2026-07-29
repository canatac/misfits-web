/**
 * React #185 regression: MailSidebar used
 *   useLabelStore((s) => s.getLabelTree())
 * which allocates a new array every selector read → infinite re-render.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MailSidebar } from "@/components/mail/sidebar";

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

describe("MailSidebar — no React max update depth", () => {
  const errors: string[] = [];
  let spy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errors.length = 0;
    mem.clear();
    spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it("mounts without Maximum update depth exceeded", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    expect(() => {
      render(
        <QueryClientProvider client={qc}>
          <MailSidebar />
        </QueryClientProvider>,
      );
    }).not.toThrow();

    const blob = errors.join("\n");
    expect(blob).not.toMatch(/Maximum update depth/i);
    expect(blob).not.toMatch(/Minified React error #185/);
    expect(blob).not.toMatch(/Too many re-renders/i);
  });
});
