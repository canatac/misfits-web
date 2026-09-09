import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/mail/theme-toggle";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  it("renders all three theme options", () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText("Clair")).toBeTruthy();
    expect(screen.getByLabelText("Sombre")).toBeTruthy();
    expect(screen.getByLabelText("Système")).toBeTruthy();
  });

  it("calls setTheme when light mode is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByLabelText("Clair"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("calls setTheme when dark mode is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByLabelText("Sombre"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme when system mode is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByLabelText("Système"));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("has correct aria-label for accessibility", () => {
    render(<ThemeToggle />);
    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("Thème");
  });
});
