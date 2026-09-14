import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EmailView } from "@/components/mail/email-view";
import type { Email } from "@/types/email";

// Mock the stores
const mockEmail: Email = {
  id: "test-1",
  threadId: "thread-1",
  folder: "inbox",
  from: { name: "Alice", address: "alice@example.com" },
  to: [{ name: "Me", address: "me@example.com" }],
  subject: "Test subject",
  preview: "Test preview",
  body: "<p>Test body</p>",
  bodyType: "html",
  date: new Date().toISOString(),
  receivedAt: new Date().toISOString(),
  isRead: false,
  isStarred: false,
  isImportant: false,
  hasAttachments: false,
  attachments: [],
  labels: [],
  size: 1024,
  messageId: "msg-1",
};

vi.mock("@/stores/email-store", () => ({
  useEmailStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      emails: [mockEmail],
      selectedEmailId: "test-1",
      toggleStar: vi.fn(),
      markUnread: vi.fn(),
      archive: vi.fn(),
      deleteEmail: vi.fn(),
    }),
}));

vi.mock("@/stores/label-store", () => ({
  useLabelStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      labels: [],
      assignments: {},
      assignLabelToEmail: vi.fn(),
      removeLabelFromEmail: vi.fn(),
    }),
}));

vi.mock("@/hooks/useEmailActions", () => ({
  useEmailActions: () => ({
    handleReply: vi.fn(),
    handleReplyAll: vi.fn(),
    replyAllRecipientCount: 1,
    handleForward: vi.fn(),
    handleToggleStar: vi.fn(),
    handleArchive: vi.fn(),
    handleDelete: vi.fn(),
    handleMarkUnread: vi.fn(),
    handleHermesSummarize: vi.fn(),
    handleHermesReplyDraft: vi.fn(),
    handleHermesTranslate: vi.fn(),
    handleHermesTodos: vi.fn(),
  }),
}));

vi.mock("@/components/mail/hooks/useEmailBody", () => ({
  useEmailBody: () => ({
    loadImages: true,
    setLoadImages: vi.fn(),
    showQuoted: true,
    setShowQuoted: vi.fn(),
    hasQuoted: false,
    processedBody: "<p>Test body</p>",
  }),
}));

vi.mock("@/components/mail/hooks/useEmailBodyHydration", () => ({
  useEmailBodyHydration: () => {},
}));

describe("EmailView — Print / PDF export", () => {
  let printSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    printSpy.mockRestore();
  });

  it("calls window.print() when Ctrl+P is pressed and an email is selected", () => {
    render(<EmailView />);
    act(() => {
      fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    });
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("calls window.print() when Cmd+P is pressed (macOS)", () => {
    render(<EmailView />);
    act(() => {
      fireEvent.keyDown(window, { key: "p", metaKey: true });
    });
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the print button in the toolbar", () => {
    render(<EmailView />);
    const printBtn = screen.getByTestId("print-email-btn");
    expect(printBtn).toBeTruthy();
  });
});
