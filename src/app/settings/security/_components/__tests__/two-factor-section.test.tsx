import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TwoFactorSection } from "../two-factor-section";

const setup2fa = vi.fn();
const activate = vi.fn();
const deactivate = vi.fn();

vi.mock("@/hooks/use-two-factor", () => ({
  useTwoFactor: () => ({
    status: { enabled: false, qrCode: null, secret: null, recoveryCodes: [] },
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
    expect(screen.getByAltText(/QR code/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
  });

  it("activates with a 6-digit code", async () => {
    const user = userEvent.setup();
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    await user.type(input, "123456");
    await user.click(screen.getByRole("button", { name: /Enable two-factor/i }));
    await waitFor(() => expect(activate).toHaveBeenCalledWith("123456"));
  });

  it("rejects a code shorter than 6 digits", async () => {
    const user = userEvent.setup();
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    await user.type(input, "123");
    expect(screen.getByRole("button", { name: /Enable two-factor/i })).toBeDisabled();
  });

  it("strips non-digit characters from the code", async () => {
    const user = userEvent.setup();
    render(<TwoFactorSection />);
    const input = screen.getByLabelText(/Verification code/i);
    await user.type(input, "1a2b3c");
    expect(input).toHaveValue("123");
  });
});
