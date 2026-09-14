import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createOnboardingEmail, isOnboardingDone, markOnboardingDone } from "@/hooks/use-onboarding-email";
import { OnboardingEmailBanner } from "@/components/mail/onboarding-email-banner";
import { OnboardingEmailView } from "@/components/mail/onboarding-email-view";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("createOnboardingEmail", () => {
  it("creates a welcome email with correct structure", () => {
    const email = createOnboardingEmail("user@example.com", "Test User");
    expect(email.id).toBe("onboarding-welcome-email");
    expect(email.from.address).toBe("hermes@misfits.ai");
    expect(email.subject).toContain("Welcome");
    expect(email.isPinned).toBe(true);
    expect(email.isOnboarding).toBe(true);
    expect(email.to[0].address).toBe("user@example.com");
  });
  it("includes shortcut reference in body", () => {
    const email = createOnboardingEmail("user@example.com");
    expect(email.body).toContain("j");
    expect(email.body).toContain("k");
    expect(email.body).toContain("/");
    expect(email.body).toContain("c");
  });
});

describe("isOnboardingDone", () => {
  beforeEach(() => { localStorageMock.clear(); });
  it("returns false when onboarding not done", () => {
    expect(isOnboardingDone()).toBe(false);
  });
  it("returns true when onboarding is done", () => {
    markOnboardingDone();
    expect(isOnboardingDone()).toBe(true);
  });
});

describe("OnboardingEmailBanner", () => {
  const mockEmail = createOnboardingEmail("user@example.com", "Test User");
  it("renders welcome email banner", () => {
    render(<OnboardingEmailBanner email={mockEmail} onDismiss={() => {}} onOpen={() => {}} />);
    expect(screen.getByTestId("onboarding-email-banner")).toBeTruthy();
    expect(screen.getByText("Hermes")).toBeTruthy();
  });
  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<OnboardingEmailBanner email={mockEmail} onDismiss={onDismiss} onOpen={() => {}} />);
    fireEvent.click(screen.getByTestId("onboarding-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  it("calls onOpen when banner is clicked", () => {
    const onOpen = vi.fn();
    render(<OnboardingEmailBanner email={mockEmail} onDismiss={() => {}} onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId("onboarding-email-banner"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("OnboardingEmailView", () => {
  const mockEmail = createOnboardingEmail("user@example.com", "Test User");
  it("renders full email view", () => {
    render(<OnboardingEmailView email={mockEmail} onBack={() => {}} onDismiss={() => {}} />);
    expect(screen.getByTestId("onboarding-email-view")).toBeTruthy();
  });
  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(<OnboardingEmailView email={mockEmail} onBack={onBack} onDismiss={() => {}} />);
    fireEvent.click(screen.getByLabelText("Back to inbox"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
  it("calls onDismiss when Got it is clicked", () => {
    const onDismiss = vi.fn();
    render(<OnboardingEmailView email={mockEmail} onBack={() => {}} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("onboarding-got-it"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
