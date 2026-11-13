import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TwoFactorSection } from "../two-factor-section";

const setup2fa = vi.fn();
const activate = vi.fn();
const deactivate = vi.fn();

vi.mock("@/hooks/use-two-factor", () => ({
  useTwoFactor: () => ({
    status: { enabled: false, qrCode: null, secret: null, recoveryCodes: [], webauthnEnabled: false },
    setup: { qrCode: "data:image/png;base64,AA", secret: "JBSWY3DPEHPK3PXP", recoveryCodes: ["aaaa-bbbb", "cccc-dddd"] },
    busy: false,
    error: null,
    setup2fa,
    activate,
    deactivate,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("TwoFactorSection", () => {
  it("shows the QR code and the manual setup key", () => {
    render(<TwoFactorSection />);
    expect(screen.getByAltText(/QR code/i)).not.toBeNull();
    expect(screen.getByDisplayValue("JBSWY3DPEHPK3PXP")).not.toBeNull();
  });

  it("activates with a 6-digit code", async () => {
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Enable two-factor/i }));
    await waitFor(() => expect(activate).toHaveBeenCalledWith("123456"));
  });

  it("rejects a code shorter than 6 digits", () => {
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    fireEvent.change(input, { target: { value: "123" } });
    expect(
      (screen.getByRole("button", { name: /Enable two-factor/i }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("strips non-digit characters from the code", () => {
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    fireEvent.change(input, { target: { value: "1a2b3c" } });
    expect((input as HTMLInputElement).value).toBe("123");
  });

  it("shows the security key registration section", () => {
    render(<TwoFactorSection />);
    expect(screen.getByText(/Security key \(FIDO2\/WebAuthn\)/i)).not.toBeNull();
    expect(screen.getByRole("button", { name: /Register security key/i })).not.toBeNull();
  });
});
