import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThreadExpandedMessages } from "@/components/mail/thread-expanded-messages";
import type { Email } from "@/types/email";

function mkEmail(id: string): Email {
  return {
    id,
    threadId: "th-1",
    folder: "inbox",
    from: { name: `User ${id}`, address: `${id}@example.com` },
    to: [{ name: "Me", address: "me@misfits.ai" }],
    subject: `Subject ${id}`,
    preview: `Preview ${id}`,
    body: `<p>${id}</p>`,
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
    messageId: `<${id}@example.com>`,
  };
}

describe("ThreadExpandedMessages progressive expansion", () => {
  it("shows initial subset then progressively reveals remaining messages", () => {
    vi.useFakeTimers();
    const messages = Array.from({ length: 7 }, (_, i) => mkEmail(`m${i + 1}`));

    render(
      <ThreadExpandedMessages
        messages={messages}
        selectedEmailId={null}
        onSelectEmail={vi.fn()}
      />
    );

    expect(screen.getByTestId("thread-msg-m1")).toBeTruthy();
    expect(screen.getByTestId("thread-msg-m2")).toBeTruthy();
    expect(screen.queryByTestId("thread-msg-m3")).toBeNull();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("thread-msg-m6")).toBeTruthy();
    expect(screen.queryByTestId("thread-msg-m7")).toBeNull();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(screen.getByTestId("thread-msg-m7")).toBeTruthy();
    vi.useRealTimers();
  });

  it("supports immediate full expansion with Voir tout", () => {
    vi.useFakeTimers();
    const messages = Array.from({ length: 10 }, (_, i) => mkEmail(`x${i + 1}`));

    render(
      <ThreadExpandedMessages
        messages={messages}
        selectedEmailId={null}
        onSelectEmail={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Voir tout (10)" }));
    expect(screen.getByTestId("thread-msg-x10")).toBeTruthy();
    vi.useRealTimers();
  });
});
