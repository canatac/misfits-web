import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Email } from "@/types/email";
import {
  CommandPalette,
  SEARCH_MIN_LENGTH,
  getSearchAnnouncement,
} from "@/components/command-palette";

const { mockEmails } = vi.hoisted(() => ({ mockEmails: [] as Email[] }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-command-palette", () => ({
  useCommandPaletteStore: (
    selector: (state: { open: boolean; closePalette: () => void }) => unknown,
  ) => selector({ open: true, closePalette: vi.fn() }),
}));

vi.mock("@/stores/composer-store", () => ({
  useComposerStore: (
    selector: (state: { openComposer: () => void }) => unknown,
  ) => selector({ openComposer: vi.fn() }),
}));

vi.mock("@/stores/email-store", () => ({
  useEmailStore: (selector: (state: { emails: Email[] }) => unknown) =>
    selector({ emails: mockEmails }),
}));

beforeAll(() => {
  // cmdk 1.1.1 scrolls the active item into view during layout effects and a
  // consumer of the palette observes resizes; neither exists in jsdom (#1146).
  if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
});

beforeEach(() => {
  mockEmails.length = 0;
});

function makeEmail(id: string, subject: string, name: string, preview: string): Email {
  return {
    id,
    subject,
    preview,
    snippet: preview,
    body: preview,
    from: { name, address: `${id}@example.com` },
    to: [{ name: "Moi", address: "me@example.com" }],
    cc: [],
    bcc: [],
    date: "2026-11-01T09:00:00.000Z",
    read: false,
    starred: false,
    folder: "inbox",
    labels: [],
    attachments: [],
    threadId: id,
  } as unknown as Email;
}

function typeQuery(value: string) {
  const input = screen.getByPlaceholderText(
    "Taper une commande ou rechercher un email...",
  );
  fireEvent.change(input, { target: { value } });
}

function announcementText(): string {
  return screen.getByTestId("command-palette-announcement").textContent ?? "";
}

describe("CommandPalette search announcements (#1146)", () => {
  it("AC1: announces the number of matching emails through a live region when it changes", async () => {
    mockEmails.push(
      makeEmail("e1", "Réunion projet", "Alice", "La réunion est déplacée"),
      makeEmail("e2", "Réunion client", "Bob", "Compte rendu de la réunion"),
      makeEmail("e3", "Facture novembre", "Carol", "Votre facture est prête"),
    );
    render(<CommandPalette />);

    typeQuery("réunion");
    await waitFor(() =>
      expect(announcementText()).toBe("2 emails trouvés."),
    );

    typeQuery("facture");
    await waitFor(() =>
      expect(announcementText()).toBe("1 email trouvé."),
    );
  });

  it("AC2: announces the empty-result message through the same live region", async () => {
    mockEmails.push(
      makeEmail("e1", "Réunion projet", "Alice", "La réunion est déplacée"),
    );
    render(<CommandPalette />);

    typeQuery("zzz");
    await waitFor(() =>
      expect(announcementText()).toBe(
        "Aucun email trouvé pour cette recherche.",
      ),
    );
  });

  it("AC3: shows a distinct announced hint below the search threshold, not the no-result message", async () => {
    mockEmails.push(
      makeEmail("e1", "Réunion projet", "Alice", "La réunion est déplacée"),
    );
    render(<CommandPalette />);

    typeQuery("a");
    await waitFor(() =>
      expect(announcementText()).toBe(
        `Tapez au moins ${SEARCH_MIN_LENGTH} caractères pour lancer la recherche.`,
      ),
    );
    expect(announcementText()).not.toBe(
      "Aucun email trouvé pour cette recherche.",
    );
    expect(
      document.getElementById("command-palette-search-hint")?.textContent,
    ).toBe(
      `Tapez au moins ${SEARCH_MIN_LENGTH} caractères pour lancer la recherche.`,
    );
  });
});

describe("getSearchAnnouncement (#1146)", () => {
  it("covers the empty query, the threshold hint, the empty result and the count", () => {
    expect(getSearchAnnouncement("", 0)).toBe("");
    expect(getSearchAnnouncement("a", 0)).toBe(
      `Tapez au moins ${SEARCH_MIN_LENGTH} caractères pour lancer la recherche.`,
    );
    expect(getSearchAnnouncement("zz", 0)).toBe(
      "Aucun email trouvé pour cette recherche.",
    );
    expect(getSearchAnnouncement("zz", 1)).toBe("1 email trouvé.");
    expect(getSearchAnnouncement("zz", 3)).toBe("3 emails trouvés.");
  });
});
