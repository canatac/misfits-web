import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  EmailListEmpty,
  type EmailListEmptyState,
} from "@/components/mail/parts/email-list/email-list-states";

afterEach(() => cleanup());

describe("EmailListEmpty — unified inbox empty states (#1172)", () => {
  const states: Array<{
    state: EmailListEmptyState;
    testId: string;
    title: string;
  }> = [
    {
      state: "syncing",
      testId: "email-list-empty-syncing",
      title: "Synchronisation en cours…",
    },
    {
      state: "empty",
      testId: "email-list-empty-no-mail",
      title: "Aucun email ici",
    },
    {
      state: "error",
      testId: "email-list-empty-connection-failed",
      title: "Connexion au compte impossible",
    },
  ];

  it.each(states)(
    "shows a distinct empty state for $state",
    ({ state, testId, title }) => {
      render(<EmailListEmpty state={state} />);
      const node = screen.getByTestId(testId);
      expect(node.tagName).toBe("DIV");
      expect(node.textContent).toContain(title);
    }
  );

  it("announces the syncing state through a live region (AC2)", () => {
    render(<EmailListEmpty state="syncing" />);
    const liveRegion = screen.getByRole("status");
    expect(liveRegion.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion.textContent).toContain("Synchronisation en cours…");
  });
});
