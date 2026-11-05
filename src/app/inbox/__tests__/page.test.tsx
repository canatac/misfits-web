import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import InboxPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("InboxPage", () => {
  const replace = vi.fn();

  beforeEach(() => {
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
  });

  it("redirects to /mail and shows a loading state", () => {
    render(<InboxPage />);
    expect(replace).toHaveBeenCalledWith("/mail");
    expect(screen.getByTestId("inbox-loading")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Opening your inbox");
  });

  it("shows an error state with retry when navigation fails", () => {
    replace.mockImplementation(() => {
      throw new Error("navigation failed");
    });
    render(<InboxPage />);
    expect(screen.getByTestId("inbox-error")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("could not open your inbox");
    replace.mockReset();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/mail");
  });
});
