import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmailHistory, HistoryButton } from "@/components/mail/email-history";

describe("EmailHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <EmailHistory open={false} emailId="email-1" onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the history panel when open is true", () => {
    render(
      <EmailHistory open={true} emailId="email-1" onClose={() => {}} />
    );
    expect(screen.getByText("Historique")).toBeTruthy();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <EmailHistory open={true} emailId="email-1" onClose={onClose} />
    );
    fireEvent.click(screen.getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });

  it("displays timeline entries with descriptions", () => {
    render(
      <EmailHistory open={true} emailId="email-1" onClose={() => {}} />
    );
    expect(screen.getByText("Email reçu")).toBeTruthy();
    expect(screen.getByText("Marqué comme lu")).toBeTruthy();
    expect(screen.getByText("Label 'Important' ajouté")).toBeTruthy();
  });

  it("shows restore button for restorable entries", () => {
    render(
      <EmailHistory open={true} emailId="email-1" onClose={() => {}} onRestore={() => {}} />
    );
    const restoreButtons = screen.getAllByText("Restaurer");
    expect(restoreButtons.length).toBeGreaterThan(0);
  });

  it("calls onRestore when restore button is clicked", () => {
    const onRestore = vi.fn();
    render(
      <EmailHistory open={true} emailId="email-1" onClose={() => {}} onRestore={onRestore} />
    );
    const restoreButtons = screen.getAllByText("Restaurer");
    fireEvent.click(restoreButtons[0]);
    expect(onRestore).toHaveBeenCalled();
  });

  it("displays timestamps for each entry", () => {
    render(
      <EmailHistory open={true} emailId="email-1" onClose={() => {}} />
    );
    // Check for time elements (formatted dates)
    const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});

describe("HistoryButton", () => {
  it("renders without crashing", () => {
    render(<HistoryButton onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<HistoryButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("shows count badge when count is provided", () => {
    render(<HistoryButton onClick={() => {}} count={5} />);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("shows 9+ for counts greater than 9", () => {
    render(<HistoryButton onClick={() => {}} count={15} />);
    expect(screen.getByText("9+")).toBeTruthy();
  });

  it("does not show badge when count is 0", () => {
    render(<HistoryButton onClick={() => {}} count={0} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("does not show badge when count is undefined", () => {
    render(<HistoryButton onClick={() => {}} />);
    // Should not have any badge text
    const button = screen.getByRole("button");
    expect(button.textContent).toBe("");
  });
});
