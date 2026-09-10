import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CommandPalette, useCommandPalette } from "@/components/mail/command-palette";

// Mock the Dialog component
vi.mock("@/components/ui/modal", () => ({
  Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="modal">{children}</div> : null,
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-content">{children}</div>
  ),
}));

// Mock the Command components
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command">{children}</div>
  ),
  CommandInput: ({ placeholder }: { placeholder?: string }) => (
    <input data-testid="command-input" placeholder={placeholder} />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-list">{children}</div>
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="command-empty">{children}</div>
  ),
  CommandGroup: ({
    children,
    heading,
  }: {
    children: React.ReactNode;
    heading: string;
  }) => (
    <div data-testid={`command-group-${heading}`}>
      <div>{heading}</div>
      {children}
    </div>
  ),
  CommandItem({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
  }) {
    return (
      <div
        data-testid="command-item"
        onClick={onSelect}
        onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    );
  },
}));

describe("CommandPalette", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onCompose: vi.fn(),
    onSearch: vi.fn(),
    onNavigate: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open is true", () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByTestId("modal")).toBeTruthy();
  });

  it("does not render when open is false", () => {
    render(<CommandPalette {...defaultProps} open={false} />);
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("renders search input", () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByTestId("command-input")).toBeTruthy();
  });

  it("renders action commands", () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText("Composer un message")).toBeTruthy();
    expect(screen.getByText("Rechercher")).toBeTruthy();
    expect(screen.getByText("Archiver la sélection")).toBeTruthy();
    expect(screen.getByText("Supprimer la sélection")).toBeTruthy();
  });

  it("renders navigation folders", () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText("Boîte de réception")).toBeTruthy();
    expect(screen.getByText("Favoris")).toBeTruthy();
    expect(screen.getByText("Archives")).toBeTruthy();
    expect(screen.getByText("Corbeille")).toBeTruthy();
    expect(screen.getByText("Pièces jointes")).toBeTruthy();
  });

  it("calls onCompose when compose item clicked", () => {
    const onCompose = vi.fn();
    render(<CommandPalette {...defaultProps} onCompose={onCompose} />);
    fireEvent.click(screen.getByText("Composer un message"));
    expect(onCompose).toHaveBeenCalled();
  });

  it("calls onSearch when search item clicked", () => {
    const onSearch = vi.fn();
    render(<CommandPalette {...defaultProps} onSearch={onSearch} />);
    fireEvent.click(screen.getByText("Rechercher"));
    expect(onSearch).toHaveBeenCalled();
  });

  it("calls onNavigate when folder item clicked", () => {
    const onNavigate = vi.fn();
    render(<CommandPalette {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Favoris"));
    expect(onNavigate).toHaveBeenCalledWith("starred");
  });

  it("calls onOpenChange(false) after action", () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette {...defaultProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText("Composer un message"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("useCommandPalette", () => {
  it("returns open state and setOpen function", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);
    expect(typeof result.current.setOpen).toBe("function");
  });

  it("toggles open state when Cmd+K is pressed", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(result.current.open).toBe(true);

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(result.current.open).toBe(false);
  });

  it("toggles open state when Ctrl+K is pressed", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(result.current.open).toBe(true);
  });

  it("does not toggle on other key combinations", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);

    fireEvent.keyDown(window, { key: "j", metaKey: true });
    expect(result.current.open).toBe(false);

    fireEvent.keyDown(window, { key: "k" });
    expect(result.current.open).toBe(false);
  });
});
