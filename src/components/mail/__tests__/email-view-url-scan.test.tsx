import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { EmailView } from "../email-view";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";
import type { Email } from "@/types/email";

function seedEmail(body: string, bodyType: "html" | "text"): Email {
  const now = new Date().toISOString();
  return {
    id: "email-1",
    threadId: "thread-1",
    folder: "inbox",
    subject: "Phishing test",
    preview: body.slice(0, 80),
    from: { address: "attacker@example.com", name: "Attacker" },
    to: [{ address: "me@example.com", name: "Me" }],
    body,
    bodyType,
    isStarred: false,
    isRead: true,
    isImportant: false,
    hasAttachments: false,
    labels: ["inbox"],
    attachments: [],
    receivedAt: now,
    date: now,
    size: body.length,
    messageId: "<email-1@attacker.example>",
  };
}

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("EmailView URL scan integration (issue #1046)", () => {
  beforeEach(() => {
    window.localStorage.setItem("misfits:url-scan-enabled", "true");
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("AC3: shows the warning badge in the email view for a suspicious URL", () => {
    useEmailStore.setState({
      emails: [seedEmail("Click https://phishing.example/steal", "text")],
      selectedEmailId: "email-1",
    });
    useLabelStore.setState({ labels: [], assignments: {} });
    renderWithProviders(<EmailView />);
    expect(screen.getByTestId("url-warning-badge")).toBeTruthy();
    expect(screen.getByText(/1 suspicious link/i)).toBeTruthy();
  });

  it("AC3: shows no badge for a legitimate URL", () => {
    useEmailStore.setState({
      emails: [seedEmail("See https://google.com/search", "text")],
      selectedEmailId: "email-1",
    });
    useLabelStore.setState({ labels: [], assignments: {} });
    renderWithProviders(<EmailView />);
    expect(screen.queryByTestId("url-warning-badge")).toBeNull();
  });

  it("AC4: intercepts a click on a suspicious link in the email view", () => {
    useEmailStore.setState({
      emails: [seedEmail("Click https://phishing.example/steal", "text")],
      selectedEmailId: "email-1",
    });
    useLabelStore.setState({ labels: [], assignments: {} });
    renderWithProviders(<EmailView />);
    const link = screen.getByText("https://phishing.example/steal");
    fireEvent.click(link);
    expect(screen.getByText(/suspicious link warning/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /proceed anyway/i })).toBeTruthy();
  });

  it("AC4: does not intercept a click on a legitimate link", () => {
    useEmailStore.setState({
      emails: [seedEmail("See https://google.com/search", "text")],
      selectedEmailId: "email-1",
    });
    useLabelStore.setState({ labels: [], assignments: {} });
    renderWithProviders(<EmailView />);
    // The sanitized body may render the URL as text or as an anchor depending
    // on the sanitizer; the behaviour under test is that no warning appears.
    const body = screen.getByTestId("email-body");
    const link = body.querySelector("a") ?? body;
    fireEvent.click(link);
    expect(screen.queryByText(/suspicious link warning/i)).toBeNull();
    expect(screen.queryByTestId("url-warning-page")).toBeNull();
  });

  it("AC5: hides the badge when the URL scan is disabled", () => {
    window.localStorage.setItem("misfits:url-scan-enabled", "false");
    useEmailStore.setState({
      emails: [seedEmail("Click https://phishing.example/steal", "text")],
      selectedEmailId: "email-1",
    });
    useLabelStore.setState({ labels: [], assignments: {} });
    renderWithProviders(<EmailView />);
    expect(screen.queryByTestId("url-warning-badge")).toBeNull();
  });
});
