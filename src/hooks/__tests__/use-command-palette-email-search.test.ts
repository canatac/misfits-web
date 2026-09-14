import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommandPaletteEmailSearch } from "@/hooks/use-command-palette-email-search";
import { useEmailStore } from "@/stores/email-store";
import type { Email } from "@/types/email";

const initialEmailState = useEmailStore.getState();

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

describe("useCommandPaletteEmailSearch", () => {
  beforeEach(() => {
    useEmailStore.setState(initialEmailState, true);
  });

  it("returns empty results for short queries", () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", subject: "Facture mensuelle" }),
        makeEmail({ id: "mail-2", subject: "Réunion équipe" }),
      ],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("a")
    );

    expect(result.current.results).toHaveLength(0);
  });

  it("returns empty results for empty query", () => {
    useEmailStore.setState({
      emails: [makeEmail({ id: "mail-1", subject: "Facture mensuelle" })],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("")
    );

    expect(result.current.results).toHaveLength(0);
  });

  it("finds emails by subject", () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", subject: "Facture mensuelle" }),
        makeEmail({ id: "mail-2", subject: "Réunion équipe" }),
      ],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("facture")
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]?.email.id).toBe("mail-1");
  });

  it("finds emails by sender name", () => {
    useEmailStore.setState({
      emails: [
        makeEmail({
          id: "mail-1",
          from: { name: "Alice Martin", address: "alice@example.com" },
        }),
        makeEmail({
          id: "mail-2",
          from: { name: "Bob Dupont", address: "bob@example.com" },
        }),
      ],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("alice")
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]?.email.id).toBe("mail-1");
  });

  it("finds emails by preview content", () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", preview: "Votre facture est disponible" }),
        makeEmail({ id: "mail-2", preview: "Réunion demain à 10h" }),
      ],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("facture")
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]?.email.id).toBe("mail-1");
  });

  it("limits results to MAX_RESULTS", () => {
    const manyEmails = Array.from({ length: 15 }, (_, i) =>
      makeEmail({
        id: `mail-${i}`,
        subject: `Facture ${i}`,
        preview: "facture",
      })
    );
    useEmailStore.setState({ emails: manyEmails });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("facture")
    );

    expect(result.current.results.length).toBeLessThanOrEqual(8);
  });

  it("returns empty results when no emails match", () => {
    useEmailStore.setState({
      emails: [makeEmail({ id: "mail-1", subject: "Facture mensuelle" })],
    });

    const { result } = renderHook(() =>
      useCommandPaletteEmailSearch("xyzzy-abc-9999")
    );

    expect(result.current.results).toHaveLength(0);
  });

  it("updates results when query changes", () => {
    useEmailStore.setState({
      emails: [
        makeEmail({ id: "mail-1", subject: "Facture mensuelle" }),
        makeEmail({ id: "mail-2", subject: "Réunion équipe" }),
      ],
    });

    const { result, rerender } = renderHook(
      ({ query }) => useCommandPaletteEmailSearch(query),
      { initialProps: { query: "facture" } }
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]?.email.id).toBe("mail-1");

    rerender({ query: "réunion" });

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]?.email.id).toBe("mail-2");
  });
});
