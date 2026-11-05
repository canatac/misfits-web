import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerPanel } from "../composer-panel";
import { useComposerStore } from "@/stores/composer-store";
import {
  DEFAULT_RECIPIENT_THRESHOLD,
  RECIPIENT_THRESHOLD_KEY,
  SKIP_SEND_CONFIRM_KEY,
} from "../composer/send-confirm-modal";
import type { Recipient } from "@/types/composer";

function mkRecipient(id: string): Recipient {
  return { id, email: `${id}@example.com`, type: "to" } as Recipient;
}

function seedRecipients(count: number) {
  const to = Array.from({ length: count }, (_, i) => mkRecipient(`r${i}`));
  useComposerStore.getState().setRecipients("to", to);
  useComposerStore.getState().setRecipients("cc", []);
  useComposerStore.getState().setRecipients("bcc", []);
  useComposerStore.getState().setSubject("Subject");
  useComposerStore.getState().setBody("<p>Body</p>");
}

afterEach(() => {
  window.localStorage.clear();
  useComposerStore.getState().setRecipients("to", []);
  useComposerStore.getState().setRecipients("cc", []);
  useComposerStore.getState().setRecipients("bcc", []);
  useComposerStore.getState().setSubject("");
  useComposerStore.getState().setBody("");
});

describe("ComposerPanel recipient threshold gate", () => {
  it("opens the confirmation modal when Envoyer is clicked above the threshold", async () => {
    seedRecipients(DEFAULT_RECIPIENT_THRESHOLD + 1);
    render(<ComposerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(
      screen.getByText(
        new RegExp(`sending to ${DEFAULT_RECIPIENT_THRESHOLD + 1} recipients`, "i")
      )
    ).toBeTruthy();
  });

  it("sends directly when the recipient count is below the threshold", () => {
    seedRecipients(1);
    render(<ComposerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sends directly when the skip preference is stored", () => {
    window.localStorage.setItem(SKIP_SEND_CONFIRM_KEY, "true");
    seedRecipients(DEFAULT_RECIPIENT_THRESHOLD + 1);
    render(<ComposerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses a stored threshold instead of the default", async () => {
    window.localStorage.setItem(RECIPIENT_THRESHOLD_KEY, "2");
    seedRecipients(3);
    render(<ComposerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText(/sending to 3 recipients/i)).toBeTruthy();
  });

  it("closes the modal on cancel without sending", async () => {
    seedRecipients(DEFAULT_RECIPIENT_THRESHOLD + 1);
    render(<ComposerPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    fireEvent.click(await screen.findByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
