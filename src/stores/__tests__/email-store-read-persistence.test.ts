import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Email } from "@/types/email";
import { useEmailStore } from "@/stores/email-store";

vi.mock("@/lib/mail-api", () => ({
  hasMailIdentity: () => true,
  mailAuthHeaders: () => ({ "x-user-id": "admin", "x-user-email": "admin@misfits.ai" }),
}));

const initialState = useEmailStore.getState();

function makeEmail(overrides?: Partial<Email>): Email {
  const now = new Date().toISOString();
  return {
    id: "e-1",
    threadId: "t-1",
    folder: "inbox",
    from: { name: "A", address: "a@misfits.ai" },
    to: [{ name: "admin", address: "admin@misfits.ai" }],
    subject: "hello",
    preview: "hello",
    body: "hello",
    bodyType: "text",
    date: now,
    receivedAt: now,
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 42,
    messageId: "<e-1@misfits.ai>",
    headers: {},
    ...overrides,
  };
}

describe("email-store read state persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEmailStore.setState(initialState, true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: "OK" })
    );
    useEmailStore.setState({
      emails: [makeEmail()],
      currentFolder: "inbox",
      selectedEmailId: null,
      selectedEmailIds: new Set<string>(),
      loading: false,
      error: null,
    });
  });

  it("persists markRead when selecting an unread email", async () => {
    useEmailStore.getState().selectEmail("e-1");

    expect(useEmailStore.getState().emails[0]?.isRead).toBe(true);

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith("/api/emails/e-1/action", {
      method: "POST",
      headers: {
        "x-user-id": "admin",
        "x-user-email": "admin@misfits.ai",
      },
      credentials: "include",
      body: JSON.stringify({ action: "markRead" }),
    });
  });

  it("persists markUnread when toggled from reader toolbar", async () => {
    useEmailStore.setState({ emails: [makeEmail({ isRead: true })] });

    useEmailStore.getState().markUnread("e-1");

    expect(useEmailStore.getState().emails[0]?.isRead).toBe(false);

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledWith("/api/emails/e-1/action", {
      method: "POST",
      headers: {
        "x-user-id": "admin",
        "x-user-email": "admin@misfits.ai",
      },
      credentials: "include",
      body: JSON.stringify({ action: "markUnread" }),
    });
  });
});
