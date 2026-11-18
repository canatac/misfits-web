/**
 * Test for the OAuth2 consent failure handling of the add-account modal
 * (issue #1104, AC4).
 *
 * A failed or revoked consent returns to the app with a clear message and a
 * way to restart the flow.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { AddAccountModal } from "../add-account-modal";

vi.mock("@/hooks/use-oauth2-providers", () => ({
  useOAuth2Providers: () => ({
    options: [{ value: "gmail", label: "Gmail" }],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-oauth2-start", () => ({
  useOAuth2Start: () => ({
    start: vi.fn().mockResolvedValue(undefined),
    pending: false,
    error: "The provider consent screen could not be opened (HTTP 401). The authorization code was revoked or expired.",
  }),
}));

describe("AddAccountModal consent failure (AC4)", () => {
  it("shows a clear message and a restart action when the consent fails", () => {
    const onOpenChange = vi.fn();
    render(<AddAccountModal open={true} onOpenChange={onOpenChange} />);

    const alert = screen.getByTestId("oauth2-start-error");
    expect(alert.textContent).toMatch(/revoked or expired/i);

    const restart = screen.getByRole("button", { name: /restart the connection/i });
    fireEvent.click(restart);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
