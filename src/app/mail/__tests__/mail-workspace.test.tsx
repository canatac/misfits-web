import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MailWorkspace } from "@/app/mail/parts/MailWorkspace";

vi.mock("@/components/mail/email-list", () => ({
  EmailList: () => <div data-testid="mock-email-list" />,
}));

vi.mock("@/components/mail/email-view", () => ({
  EmailView: () => <div data-testid="mock-email-view" />,
}));

vi.mock("@/components/mail/thread-view", () => ({
  ThreadView: () => <div data-testid="mock-thread-view" />,
}));

vi.mock("@/components/mail/chat-panel", () => ({
  ChatPanel: () => <div data-testid="mock-chat-panel" />,
}));

describe("MailWorkspace", () => {
  it("keeps list at full width and hides detail pane when no email is selected", () => {
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={false}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={true}
        onCloseChat={() => {}}
      />
    );

    const listPane = screen.getByTestId("mail-list-pane");
    const detailPane = screen.getByTestId("mail-detail-pane");

    expect(listPane.className).toContain("lg:flex-1");
    expect(listPane.className).toContain("lg:w-full");
    expect(detailPane.className).toContain("hidden");
    expect(screen.queryByTestId("mock-email-view")).toBeNull();
  });

  it("shows detail pane after selection on desktop", () => {
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={true}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={false}
        onCloseChat={() => {}}
      />
    );

    const detailPane = screen.getByTestId("mail-detail-pane");
    expect(detailPane.className).toContain("lg:block");
    expect(screen.getByTestId("mock-email-view")).toBeTruthy();
  });
});
