import { beforeEach, describe, expect, it } from "vitest";
import type { Email } from "@/types/email";
import { useEmailStore } from "@/stores/email-store";
import { useSearchStore } from "@/stores/search-store";

const initialEmailState = useEmailStore.getState();
const initialSearchState = useSearchStore.getState();

const TOKEN = "TOKEN-SEARCH-XYZ-987654";

function makeEmail(overrides?: Partial<Email>): Email {
  const now = new Date().toISOString();
  return {
    id: "mail-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Support", address: "support@misfits.ai" },
    to: [{ name: "admin", address: "admin@misfits.ai" }],
    subject: `Facture ${TOKEN}`,
    preview: "Votre document est disponible",
    body: "Bonjour, le document est en pièce jointe.",
    bodyType: "text",
    date: now,
    receivedAt: now,
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 120,
    messageId: "<mail-1@misfits.ai>",
    headers: {},
    ...overrides,
  };
}

describe("search-store live corpus", () => {
  beforeEach(() => {
    localStorage.clear();
    useEmailStore.setState(initialEmailState, true);
    useSearchStore.setState(initialSearchState, true);
  });

  it("searches in live email store when no explicit corpus is provided", () => {
    useEmailStore.setState({ emails: [makeEmail()] });
    useSearchStore.getState().setSearchQuery(TOKEN);

    useSearchStore.getState().executeSearch();

    const state = useSearchStore.getState();
    expect(state.results).toHaveLength(1);
    expect(state.results[0]?.email.id).toBe("mail-1");
  });

});
