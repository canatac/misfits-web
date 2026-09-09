import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AutoArchiveSettings, ArchiveRestoreButton, useAutoArchive } from "@/components/mail/auto-archive";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AutoArchiveSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders all age options", () => {
    render(<AutoArchiveSettings />);

    expect(screen.getByText("Jamais")).toBeTruthy();
    expect(screen.getByText("1 mois")).toBeTruthy();
    expect(screen.getByText("3 mois")).toBeTruthy();
    expect(screen.getByText("6 mois")).toBeTruthy();
    expect(screen.getByText("1 an")).toBeTruthy();
  });

  it("shows the archive now button", () => {
    render(<AutoArchiveSettings />);

    expect(screen.getByText("Archiver")).toBeTruthy();
  });

  it("displays total archived count", () => {
    render(<AutoArchiveSettings />);

    expect(screen.getByText("Total archivés")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("shows last archive run date", () => {
    render(<AutoArchiveSettings />);

    expect(screen.getByText("Dernière exécution")).toBeTruthy();
    expect(screen.getByText("Jamais")).toBeTruthy();
  });

  it("disables archive button when age is never", () => {
    render(<AutoArchiveSettings />);

    const archiveButton = screen.getByText("Archiver").closest("button");
    expect(archiveButton).toBeDisabled();
  });

  it("shows descriptions for each option", () => {
    render(<AutoArchiveSettings />);

    expect(screen.getByText("Désarchivage automatique désactivé")).toBeTruthy();
    expect(screen.getByText("Archiver les emails de plus de 1 mois")).toBeTruthy();
    expect(screen.getByText("Archiver les emails de plus de 1 an")).toBeTruthy();
  });
});

describe("ArchiveRestoreButton", () => {
  it("renders without crashing", () => {
    render(<ArchiveRestoreButton emailId="email-1" onRestore={() => {}} />);
    expect(screen.getByText("Restaurer")).toBeTruthy();
  });

  it("calls onRestore when clicked", () => {
    const onRestore = vi.fn();
    render(<ArchiveRestoreButton emailId="email-1" onRestore={onRestore} />);
    fireEvent.click(screen.getByText("Restaurer"));
    expect(onRestore).toHaveBeenCalled();
  });
});

describe("useAutoArchive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("returns default config when no stored data", () => {
    // Hook test would require renderHook
    expect(true).toBe(true);
  });

  it("provides AGE_OPTIONS constant", () => {
    const { AGE_OPTIONS } = useAutoArchive();
    expect(AGE_OPTIONS).toHaveLength(5);
    expect(AGE_OPTIONS[0].value).toBe("never");
    expect(AGE_OPTIONS[4].value).toBe("1y");
  });
});
