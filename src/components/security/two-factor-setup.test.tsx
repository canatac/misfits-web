import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TwoFactorSetup } from "./two-factor-setup";

describe("TwoFactorSetup", () => {
  it("renders QR step initially", () => {
    render(<TwoFactorSetup onComplete={vi.fn()} />);
    expect(screen.getByText(/scan this QR code/i)).toBeTruthy();
  });

  it("shows error on invalid code", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    render(<TwoFactorSetup onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText(/next/i));
    const input = screen.getByLabelText(/TOTP verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText(/verify/i));
    expect(await screen.findByText(/invalid code/i)).toBeTruthy();
  });

  it("shows recovery codes after successful verification", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recoveryCodes: ["AAAA-BBBB", "CCCC-DDDD"] }),
    });
    render(<TwoFactorSetup onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText(/next/i));
    const input = screen.getByLabelText(/TOTP verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByText(/verify/i));
    expect(await screen.findByText(/2FA enabled/i)).toBeTruthy();
    expect(screen.getByText("AAAA-BBBB")).toBeTruthy();
  });
});
