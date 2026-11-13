import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmailView } from "../email-view";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";

function seedEmail(body: string, bodyType: "html" | "text") {
  useEmailStore.setState({
    emails: [
      {
        id: "email-1",
        subject: "Phishing test",
        from: "attacker@example.com",
        to: "me@example.com",
        body,
        bodyType,
        isStarred: false,
        isRead: true,
        labels: ["inbox"],
        attachments: [],
        receivedAt: new Date().toISOString(),
      },
    ],
    selectedEmailId: "email-1",
  });
  useLabelStore.setState({ labels: [], assignments: {} });
}

describe("EmailView URL scan integration (issue #1046)", () => {
  beforeEach(() => {
    window.localStorage.setItem("misfits:url-scan-enabled", "true");
  });

  it("AC3: shows the warning badge in the email view for a suspicious URL", () => {
    seedEmail("Click https://phishing.example/steal", "text");
    render(<EmailView />);
    expect(screen.getByTestId("url-warning-badge")).toBeTruthy();
    expect(screen.getByText(/1 suspicious link/i)).toBeTruthy();
  });

  it("AC3: shows no badge for a legitimate URL", () => {
    seedEmail("See https://google.com/search", "text");
    render(<EmailView />);
    expect(screen.queryByTestId("url-warning-badge")).toBeNull();
  });

  it("AC4: intercepts a click on a suspicious link in the email view", () => {
    seedEmail("Click https://phishing.example/steal", "text");
    render(<EmailView />);
    const link = screen.getByText("https://phishing.example/steal");
    fireEvent.click(link);
    expect(screen.getByText(/suspicious link warning/i)).toBeTruthy();
  });

  it("AC5: hides the badge when the URL scan is disabled", () => {
    window.localStorage.setItem("misfits:url-scan-enabled", "false");
    seedEmail("Click https://phishing.example/steal", "text");
    render(<EmailView />);
    expect(screen.queryByTestId("url-warning-badge")).toBeNull();
  });
});
