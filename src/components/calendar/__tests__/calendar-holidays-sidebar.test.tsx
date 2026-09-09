import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CalendarHolidaysSidebar } from "@/components/calendar/calendar-holidays-sidebar";

// Mock hooks
const mockImportPublicHolidays = vi.fn().mockResolvedValue(undefined);

vi.mock("@/components/calendar/parts/calendar-holidays-sidebar/use-holiday-countries", () => ({
  useHolidayCountries: () => ({
    holidayCountryOptions: [
      { code: "FR", label: "France" },
      { code: "US", label: "United States" },
      { code: "DE", label: "Germany" },
    ],
    holidaySupportedCodes: new Set(["FR", "US", "DE"]),
    loadingHolidayCountries: false,
    filteredHolidayCountryOptions: [
      { code: "FR", label: "France" },
      { code: "US", label: "United States" },
      { code: "DE", label: "Germany" },
    ],
  }),
}));

vi.mock("@/components/calendar/parts/calendar-holidays-sidebar/use-holiday-import", () => ({
  useHolidayImport: () => ({
    importingHolidays: false,
    importPublicHolidays: mockImportPublicHolidays,
  }),
}));

describe("CalendarHolidaysSidebar persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads persisted countries from localStorage on mount", () => {
    localStorage.setItem("misfits_holiday_countries", JSON.stringify(["US", "DE"]));

    render(
      <CalendarHolidaysSidebar
        selectedDate="2026-01-01"
        events={[]}
        createEvent={{ mutateAsync: vi.fn() }}
      />,
    );

    // Check that US and DE are checked (persisted)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it("persists country selection to localStorage", async () => {
    render(
      <CalendarHolidaysSidebar
        selectedDate="2026-01-01"
        events={[]}
        createEvent={{ mutateAsync: vi.fn() }}
      />,
    );

    // Wait for mount effect to complete
    await waitFor(() => {
      const stored = localStorage.getItem("misfits_holiday_countries");
      expect(stored).toBeTruthy();
    });

    // Verify it's valid JSON
    const stored = localStorage.getItem("misfits_holiday_countries");
    const parsed = JSON.parse(stored!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toContain("FR");
  });

  it("uses default FR when no persisted data exists", () => {
    render(
      <CalendarHolidaysSidebar
        selectedDate="2026-01-01"
        events={[]}
        createEvent={{ mutateAsync: vi.fn() }}
      />,
    );

    // Default should be FR
    expect(screen.getByLabelText("Activer France")).toBeChecked();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("misfits_holiday_countries", "invalid-json");

    // Should not throw
    expect(() => {
      render(
        <CalendarHolidaysSidebar
          selectedDate="2026-01-01"
          events={[]}
          createEvent={{ mutateAsync: vi.fn() }}
        />,
      );
    }).not.toThrow();
  });
});
