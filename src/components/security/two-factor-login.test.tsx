import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TwoFactorLogin } from "./two-factor-login";

describe("TwoFactorLogin", () => {
  it("renders the code step after a password-only login", () => {
    render(<TwoFactorLogin challengeId="ch-1" onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/TOTP verification code/i)).toBeTruthy();
  });

  it("submits the 6-digit code to the verify endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock;
    render(<TwoFactorLogin challengeId="ch-1" onCancel={vi.fn()} />);
    const input = screen.getByLabelText(/TOTP verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText(/verify/i));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/2fa/verify-login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ challengeId: "ch-1", code: "123456" }),
      })
    );
  });

  it("shows an error when verification fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<TwoFactorLogin challengeId="ch-1" onCancel={vi.fn()} />);
    const input = screen.getByLabelText(/TOTP verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText(/verify/i));
    expect(await screen.findByText(/invalid code/i)).toBeTruthy();
  });
});
