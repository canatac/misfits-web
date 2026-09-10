import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThreadView } from "@/components/mail/thread-view";
import type { Thread } from "@/types/thread";

const mockThread: Thread = {
  id: "th-1",
  subject: "Test Thread",
  messages: [
    {
      id: "m1",
      threadId: "th-1",
      folder: "inbox",
      from: { name: "Alice", address: "alice@example.com" },
      to: [{ name: "Me", address: "me@misfits.ai" }],
      subject: "First message",
      preview: "Preview of first message",
      body: "<p>First message body</p>",
      bodyType: "html",
      date: "2026-09-08T00:00:00Z",
      receivedAt: "2026-09-08T00:00:00Z",
      isRead: true,
      isStarred: false,
      isImportant: false,
      hasAttachments: false,
      attachments: [],
      labels: [],
      size: 42,
      messageId: "<m1@example.com>",
    },
    {
      id: "m2",
      threadId: "th-1",
      folder: "inbox",
      from: { name: "Bob", address: "bob@example.com" },
      to: [{ name: "Me", address: "me@misfits.ai" }],
      subject: "Second message",
      preview: "Preview of second message",
      body: "<p>Second message body</p>",
      bodyType: "html",
      date: "2026-09-08T01:00:00Z",
      receivedAt: "2026-09-08T01:00:00Z",
      isRead: true,
      isStarred: false,
      isImportant: false,
      hasAttachments: false,
      attachments: [],
      labels: [],
      size: 42,
      messageId: "<m2@example.com>",
    },
    {
      id: "m3",
      threadId: "th-1",
      folder: "inbox",
      from: { name: "Charlie", address: "charlie@example.com" },
      to: [{ name: "Me", address: "me@misfits.ai" }],
      subject: "Third message",
      preview: "Preview of third message",
      body: "<p>Third message body</p>",
      bodyType: "html",
      date: "2026-09-08T02:00:00Z",
      receivedAt: "2026-09-08T02:00:00Z",
      isRead: false,
      isStarred: false,
      isImportant: false,
      hasAttachments: false,
      attachments: [],
      labels: [],
      size: 42,
      messageId: "<m3@example.com>",
    },
  ],
  participants: [
    { name: "Alice", address: "alice@example.com" },
    { name: "Bob", address: "bob@example.com" },
    { name: "Charlie", address: "charlie@example.com" },
  ],
  lastMessageDate: "2026-09-08T02:00:00Z",
  firstMessageDate: "2026-09-08T00:00:00Z",
  unreadCount: 1,
  messageCount: 3,
  hasAttachments: false,
  labels: [],
  folder: "inbox",
};

vi.mock("@/hooks/use-threads", () => ({
  useThreadActions: () => ({
    forwardThread: vi.fn(),
    replyToThread: vi.fn(),
  }),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("ThreadView expand/collapse all", () => {
  it("renders the toggle button in the header", () => {
    render(<ThreadView thread={mockThread} viewMode="list" />);
    const button = screen.getByTestId("thread-toggle-all");
    expect(button).toBeTruthy();
    expect(button.textContent).toContain("Expand all");
  });

  it("expands all messages when 'Expand all' is clicked", () => {
    render(<ThreadView thread={mockThread} viewMode="list" />);

    const button = screen.getByTestId("thread-toggle-all");
    fireEvent.click(button);

    expect(button.textContent).toContain("Collapse all");

    const m1 = screen.getByTestId("thread-message-m1");
    const m2 = screen.getByTestId("thread-message-m2");
    const m3 = screen.getByTestId("thread-message-m3");

    expect(within(m1).getByText("First message body")).toBeTruthy();
    expect(within(m2).getByText("Second message body")).toBeTruthy();
    expect(within(m3).getByText("Third message body")).toBeTruthy();
  });

  it("collapses all messages when 'Collapse all' is clicked after expanding", () => {
    render(<ThreadView thread={mockThread} viewMode="list" />);

    const button = screen.getByTestId("thread-toggle-all");
    fireEvent.click(button);
    expect(button.textContent).toContain("Collapse all");

    fireEvent.click(button);
    expect(button.textContent).toContain("Expand all");

    const m1 = screen.getByTestId("thread-message-m1");
    const m2 = screen.getByTestId("thread-message-m2");
    const m3 = screen.getByTestId("thread-message-m3");

    expect(within(m1).getByText("Preview of first message")).toBeTruthy();
    expect(within(m2).getByText("Preview of second message")).toBeTruthy();
    expect(within(m3).getByText("Preview of third message")).toBeTruthy();
  });

  it("resets collapse state when individual message is toggled", () => {
    render(<ThreadView thread={mockThread} viewMode="list" />);

    const toggleAllButton = screen.getByTestId("thread-toggle-all");
    fireEvent.click(toggleAllButton);
    expect(toggleAllButton.textContent).toContain("Collapse all");

    const m1 = screen.getByTestId("thread-message-m1");
    const collapseButton = within(m1).getByRole("button", { name: /collapse message/i });
    fireEvent.click(collapseButton);

    expect(toggleAllButton.textContent).toContain("Expand all");
  });
});
