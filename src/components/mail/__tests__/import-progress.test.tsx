import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImportProgress } from "@/components/mail/import-progress";

describe("ImportProgress", () => {
  it("renders progress bar with correct percentage", () => {
    render(
      <ImportProgress
        total={100}
        current={50}
        successes={45}
        failures={5}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Import en cours: 50/100 emails")).toBeTruthy();
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });

  it("shows completion state when import is done", () => {
    render(
      <ImportProgress
        total={50}
        current={50}
        successes={48}
        failures={2}
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText("Import terminé: 48 réussis, 2 échoués"),
    ).toBeTruthy();
    expect(screen.getByText("Fermer")).toBeTruthy();
  });

  it("toggles details on click", () => {
    render(
      <ImportProgress
        total={100}
        current={50}
        successes={45}
        failures={5}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("progressbar"));
    expect(screen.getByText("45 réussis")).toBeTruthy();
    expect(screen.getByText("5 échoués")).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ImportProgress
        total={50}
        current={50}
        successes={50}
        failures={0}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows loading spinner during import", () => {
    render(
      <ImportProgress
        total={100}
        current={50}
        successes={45}
        failures={5}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Import en cours/)).toBeTruthy();
  });

  it("hides close button during active import", () => {
    render(
      <ImportProgress
        total={100}
        current={50}
        successes={45}
        failures={5}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText("Fermer")).toBeNull();
  });
});
