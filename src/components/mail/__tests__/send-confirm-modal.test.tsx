import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RECIPIENT_THRESHOLD,
  RECIPIENT_THRESHOLD_KEY,
  SKIP_SEND_CONFIRM_KEY,
  SendConfirmModal,
  getRecipientThreshold,
  setRecipientThreshold,
  setSkipSendConfirm,
  shouldSkipSendConfirm,
} from "@/components/mail/composer/send-confirm-modal";
import type { Recipient } from "@/types/composer";

function mkRecipient(id: string, email: string): Recipient {
  return { id, email, name: email.split("@")[0] } as Recipient;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("send confirmation threshold helpers", () => {
  it("defaults to 10 when unset", () => {
    expect(getRecipientThreshold()).toBe(DEFAULT_RECIPIENT_THRESHOLD);
  });

  it("reads a stored threshold", () => {
    setRecipientThreshold(25);
    expect(getRecipientThreshold()).toBe(25);
    expect(window.localStorage.getItem(RECIPIENT_THRESHOLD_KEY)).toBe("25");
  });

  it("falls back to the default for invalid values", () => {
    setRecipientThreshold(0);
    expect(getRecipientThreshold()).toBe(DEFAULT_RECIPIENT_THRESHOLD);
    setRecipientThreshold(-3);
    expect(getRecipientThreshold()).toBe(DEFAULT_RECIPIENT_THRESHOLD);
  });

  it("persists the skip preference", () => {
    expect(shouldSkipSendConfirm()).toBe(false);
    setSkipSendConfirm(true);
    expect(shouldSkipSendConfirm()).toBe(true);
    expect(window.localStorage.getItem(SKIP_SEND_CONFIRM_KEY)).toBe("true");
  });
});

describe("SendConfirmModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <SendConfirmModal
        open={false}
        to={[mkRecipient("1", "a@example.com")]}
        cc={[]}
        bcc={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the total recipient count and the grouped lists", () => {
    render(
      <SendConfirmModal
        open
        to={[mkRecipient("1", "a@example.com"), mkRecipient("2", "b@example.com")]}
        cc={[mkRecipient("3", "c@example.com")]}
        bcc={[mkRecipient("4", "d@example.com")]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/sending to 4 recipients/i)).toBeTruthy();
    expect(screen.getByText("To (2)")).toBeTruthy();
    expect(screen.getByText("Cc (1)")).toBeTruthy();
    expect(screen.getByText("Bcc (1)")).toBeTruthy();
    expect(screen.getByText("a@example.com")).toBeTruthy();
    expect(screen.getByText("d@example.com")).toBeTruthy();
  });

  it("has a dialog role and is labelled", () => {
    render(
      <SendConfirmModal
        open
        to={[mkRecipient("1", "a@example.com")]}
        cc={[]}
        bcc={[]}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/sending to 1 recipient/i)).toBeTruthy();
  });

  it("confirms and reports the skip preference", () => {
    const onConfirm = vi.fn();
    render(
      <SendConfirmModal
        open
        to={[mkRecipient("1", "a@example.com")]}
        cc={[]}
        bcc={[]}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/don't ask again/i));
    fireEvent.click(screen.getByRole("button", { name: /confirm send/i }));
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it("cancels without confirming", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <SendConfirmModal
        open
        to={[mkRecipient("1", "a@example.com")]}
        cc={[]}
        bcc={[]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const onCancel = vi.fn();
    render(
      <SendConfirmModal
        open
        to={[mkRecipient("1", "a@example.com")]}
        cc={[]}
        bcc={[]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
