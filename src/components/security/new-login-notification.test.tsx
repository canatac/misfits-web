import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewLoginNotification } from "./new-login-notification";

describe("NewLoginNotification", () => {
  it("renders a notification when a last login timestamp is present", () => {
    render(<NewLoginNotification lastLoginAt="2026-11-01T10:00:00Z" />);
    expect(screen.getByText(/new sign-in detected/i)).toBeTruthy();
  });

  it("renders nothing without a last login timestamp", () => {
    const { container } = render(<NewLoginNotification />);
    expect(container.firstChild).toBeNull();
  });

  it("dismisses the notification on click", () => {
    render(<NewLoginNotification lastLoginAt="2026-11-01T10:00:00Z" />);
    fireEvent.click(screen.getByText(/dismiss/i));
    expect(screen.queryByText(/new sign-in detected/i)).toBeNull();
  });
});
