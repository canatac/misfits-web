import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CredentialsForm } from "../credentials-form";

type RenderOptions = {
  invalidCredentials?: boolean;
  password?: string;
  oauthPending?: "github" | null;
};

function renderForm(options: RenderOptions = {}) {
  const { invalidCredentials = false, password = "", oauthPending = null } = options;

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
      oauthPending={oauthPending}
      onGithub={() => {}}
    />
  );
}

describe("CredentialsForm password error announcement", () => {
  it("references the error message with aria-describedby when credentials are invalid", () => {
    renderForm({ invalidCredentials: true, password: "wrong-password" });

    const passwordField = screen.getByLabelText("Password");

    expect(passwordField.getAttribute("aria-invalid")).toBe("true");
    expect(passwordField.getAttribute("aria-describedby")).toBe(
      "password-error"
    );
    const alert = screen.getByText(/Incorrect password/);
    expect(alert.getAttribute("role")).toBe("alert");
  });

  it("does not reference the error message when credentials are valid", () => {
    renderForm({ invalidCredentials: false, password: "secret" });

    const passwordField = screen.getByLabelText("Password");

    expect(passwordField.getAttribute("aria-invalid")).toBe("false");
    expect(passwordField.getAttribute("aria-describedby")).toBe("password-help");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the character count in the live region, not in the error message", () => {
    renderForm({ invalidCredentials: false, password: "secret" });

    const counter = screen.getByText("6 characters entered.");
    expect(counter.getAttribute("aria-live")).toBe("polite");
  });
});

describe("CredentialsForm GitHub sign-in button", () => {
  it("shows the label in English, matching the rest of the login card", () => {
    renderForm();

    const button = screen.getByRole("button", { name: /Continue with GitHub/ });

    expect(button).toBeTruthy();
    expect(screen.queryByText(/Continuer avec GitHub/)).toBeNull();
  });

  it("shows a visible loading label while the GitHub redirect is pending", () => {
    renderForm({ oauthPending: "github" });

    const button = screen.getByRole("button", {
      name: /Connecting to GitHub/,
    });

    expect(button).toBeTruthy();
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText("Continue with GitHub")).toBeNull();
  });
});
