import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CredentialsForm } from "../credentials-form";

type RenderOptions = {
  invalidCredentials?: boolean;
  password?: string;
};

function renderForm(options: RenderOptions = {}) {
  const { invalidCredentials = false, password = "" } = options;

  return render(
    <CredentialsForm
      email="admin"
      setEmail={() => {}}
      emailError={false}
      setEmailTouched={() => {}}
      password={password}
      setPassword={() => {}}
      remember={false}
      setRemember={() => {}}
      onSubmit={() => {}}
      submitting={false}
      loginPending={false}
      rateLimited={false}
      retryAfter={undefined}
      invalidCredentials={invalidCredentials}
      oauthPending={null}
      onGithub={() => {}}
    />
  );
}

describe("CredentialsForm password error announcement", () => {
  it("references the error message with aria-describedby when credentials are invalid", () => {
    renderForm({ invalidCredentials: true, password: "wrong-password" });

    const passwordField = screen.getByLabelText("Password");

    expect(passwordField).toHaveAttribute("aria-invalid", "true");
    expect(passwordField).toHaveAttribute(
      "aria-describedby",
      "password-error"
    );
    expect(screen.getByText(/Incorrect password/)).toHaveAttribute(
      "role",
      "alert"
    );
  });

  it("does not reference the error message when credentials are valid", () => {
    renderForm({ invalidCredentials: false, password: "secret" });

    const passwordField = screen.getByLabelText("Password");

    expect(passwordField).toHaveAttribute("aria-invalid", "false");
    expect(passwordField).toHaveAttribute(
      "aria-describedby",
      "password-help"
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the character count in the live region, not in the error message", () => {
    renderForm({ invalidCredentials: false, password: "secret" });

    expect(screen.getByText("6 characters entered.")).toHaveAttribute(
      "aria-live",
      "polite"
    );
  });
});
