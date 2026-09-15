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
    const onCloseDetail = vi.fn();
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={false}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={true}
        focusMode={false}
        onToggleFocusMode={() => {}}
        onCloseChat={() => {}}
        onCloseDetail={onCloseDetail}
      />
    );

    const listPane = screen.getByTestId("mail-list-pane");
    const detailPane = screen.getByTestId("mail-detail-pane");

    expect(listPane.className).toContain("lg:flex-1");
    expect(listPane.className).toContain("lg:w-full");
    expect(detailPane.className).toContain("hidden");
    expect(screen.queryByTestId("mock-email-view")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /fermer le détail du mail/i })
    ).toBeNull();
  });

  it("shows detail pane after selection on desktop", () => {
    const onCloseDetail = vi.fn();
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={true}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={false}
        focusMode={false}
        onToggleFocusMode={() => {}}
        onCloseChat={() => {}}
        onCloseDetail={onCloseDetail}
      />
    );

    const detailPane = screen.getByTestId("mail-detail-pane");
    const closeButton = screen.getByRole("button", {
      name: /fermer le détail du mail/i,
    });
    expect(detailPane.className).toContain("lg:block");
    expect(screen.getByTestId("mock-email-view")).toBeTruthy();

    closeButton.click();
    expect(onCloseDetail).toHaveBeenCalledTimes(1);
  });

  it("collapses list pane when focus mode is active", () => {
    const onToggle = vi.fn();
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={true}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={false}
        focusMode={true}
        onToggleFocusMode={onToggle}
        onCloseChat={() => {}}
        onCloseDetail={() => {}}
      />
    );

    const listPane = screen.getByTestId("mail-list-pane");
    expect(listPane.className).toContain("w-0");
    expect(listPane.className).toContain("shrink-0");
    expect(listPane.className).toContain("border-transparent");
    expect(screen.queryByTestId("mock-email-list")).toBeNull();
  });

  it("toggles focus mode via toolbar button", () => {
    const onToggle = vi.fn();
    render(
      <MailWorkspace
        mobileView="list"
        hasDesktopSelection={true}
        threadingEnabled={false}
        selectedThread={null}
        viewMode="list"
        desktopChatOpen={false}
        focusMode={false}
        onToggleFocusMode={onToggle}
        onCloseChat={() => {}}
        onCloseDetail={() => {}}
      />
    );

    const toggle = screen.getByTestId("focus-mode-toggle");
    expect(toggle).toBeTruthy();
    toggle.click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
