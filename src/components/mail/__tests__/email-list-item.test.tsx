import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailListItem } from "@/components/mail/email-list-item";
import type { Email } from "@/types/email";

const mockEmail = {
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
} satisfies Email;

vi.mock("@/stores/label-store", () => ({
  useLabelStore: () => [],
}));

vi.mock("@/stores/account-store", () => ({
  useAccountStore: () => ({ isUnifiedInbox: false, accounts: [] }),
}));

describe("EmailListItem focus indicator", () => {
  it("applies green border and dark background when active", () => {
    render(
      <EmailListItem
        email={mockEmail}
        isActive={true}
        isSelected={false}
        onSelect={() => {}}
        onToggleSelection={() => {}}
        onToggleStar={() => {}}
      />,
    );
    const item = screen.getByTestId("email-item-test-1");
    expect(item.className).toContain("border-[#00D400]");
    expect(item.className).toContain("bg-[#1E1A15]");
  });

  it("applies default background when not active and read", () => {
    render(
      <EmailListItem
        email={{ ...mockEmail, isRead: true }}
        isActive={false}
        isSelected={false}
        onSelect={() => {}}
        onToggleSelection={() => {}}
        onToggleStar={() => {}}
      />,
    );
    const item = screen.getByTestId("email-item-test-1");
    expect(item.className).not.toContain("border-[#00D400]");
  });

  it("has focus-visible outline for keyboard navigation", () => {
    render(
      <EmailListItem
        email={mockEmail}
        isActive={false}
        isSelected={false}
        onSelect={() => {}}
        onToggleSelection={() => {}}
        onToggleStar={() => {}}
      />,
    );
    const item = screen.getByTestId("email-item-test-1");
    expect(item.className).toContain("focus-visible:outline-[#00D400]");
  });
});
