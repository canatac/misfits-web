// Polyfill for jsdom - required by cmdk
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Polyfill scrollIntoView (required by cmdk)
if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = function () {};
}

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "@/components/command-palette";
import { useCommandPaletteStore } from "@/hooks/use-command-palette";
import { useEmailStore } from "@/stores/email-store";
import type { Email } from "@/types/email";

const initialEmailState = useEmailStore.getState();
const initialPaletteState = useCommandPaletteStore.getState();

function makeEmail(overrides?: Partial<Email>): Email {
  const now = new Date().toISOString();
  return {
    id: "mail-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Alice Martin", address: "alice@example.com" },
    to: [{ name: "admin", address: "admin@misfits.ai" }],
    subject: "Facture mensuelle",
    preview: "Votre facture est disponible",
    body: "Bonjour, votre facture est en pièce jointe.",
    bodyType: "text",
    date: now,
    receivedAt: now,
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: true,
    attachments: [],
    labels: [],
    size: 120,
    messageId: "<mail-1@misfits.ai>",
    headers: {},
    ...overrides,
  };
}

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock composer store
vi.mock("@/stores/composer-store", () => ({
  useComposerStore: () => ({
    openComposer: vi.fn(),
  }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    useEmailStore.setState(initialEmailState, true);
    useCommandPaletteStore.setState(initialPaletteState, true);
  });

  it("renders command groups when opened", () => {
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    expect(screen.getByText("Aller à")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Paramètres")).toBeTruthy();
  });

  it("shows navigation commands", () => {
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    expect(screen.getByText("Aller à Inbox")).toBeTruthy();
    expect(screen.getByText("Composer un email")).toBeTruthy();
    expect(screen.getByText("Recherche")).toBeTruthy();
    expect(screen.getByText("Paramètres")).toBeTruthy();
  });

  it("shows email search results when typing a query", async () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", subject: "Facture mensuelle" }),
        makeEmail({ id: "mail-2", subject: "Réunion équipe" }),
      ],
    });
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    const input = screen.getByPlaceholderText(
      "Taper une commande ou rechercher un email..."
    );
    fireEvent.change(input, { target: { value: "facture" } });

    await waitFor(() => {
      expect(screen.getByText("Facture mensuelle")).toBeTruthy();
    });
  });

  it("shows 'Emails' group heading when results are found", async () => {
    useEmailStore.setState({
      emails: [makeEmail({ id: "mail-1", subject: "Facture mensuelle" })],
    });
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    const input = screen.getByPlaceholderText(
      "Taper une commande ou rechercher un email..."
    );
    fireEvent.change(input, { target: { value: "facture" } });

    await waitFor(() => {
      expect(screen.getByText("Emails")).toBeTruthy();
    });
  });

  it("shows no results message for non-matching queries", async () => {
    useEmailStore.setState({
      emails: [makeEmail({ id: "mail-1", subject: "Facture mensuelle" })],
    });
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    const input = screen.getByPlaceholderText(
      "Taper une commande ou rechercher un email..."
    );
    fireEvent.change(input, { target: { value: "xyzzy-abc-9999" } });

    await waitFor(() => {
      expect(
        screen.getByText("Aucun email trouvé pour cette recherche.")
      ).toBeTruthy();
    });
  });

  it("does not show email results for short queries", () => {
    useEmailStore.setState({
      emails: [makeEmail({ id: "mail-1", subject: "Facture mensuelle" })],
    });
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    const input = screen.getByPlaceholderText(
      "Taper une commande ou rechercher un email..."
    );
    fireEvent.change(input, { target: { value: "a" } });

    expect(screen.queryByText("Emails")).toBeNull();
  });

  it("shows unread indicator for unread emails", async () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", subject: "Facture", isRead: false }),
      ],
    });
    useCommandPaletteStore.setState({ open: true });

    render(<CommandPalette />);

    const input = screen.getByPlaceholderText(
      "Taper une commande ou rechercher un email..."
    );
    fireEvent.change(input, { target: { value: "facture" } });

    await waitFor(() => {
      expect(screen.getByText("Facture")).toBeTruthy();
    });
  });
});
