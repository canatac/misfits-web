import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailListItem } from "@/components/mail/email-list-item";

const mockEmail = {
  id: "test-1",
  from: { name: "Alice", email: "alice@example.com" },
  subject: "Test subject",
  preview: "Test preview",
  date: new Date().toISOString(),
  isRead: false,
  isStarred: false,
  hasAttachments: false,
  labels: [],
  accountId: null,
};

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
