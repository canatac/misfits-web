import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MailSidebarHost } from "../MailSidebarHost";

vi.mock("@/components/mail/sidebar", () => ({
  MailSidebar: ({ className }: { className?: string }) => (
    <div data-testid="mail-sidebar" className={className}>
      Sidebar
    </div>
  ),
}));

vi.mock("@/components/mail/novamail-icon-rail", () => ({
  NovaMailIconRail: ({ onCompose }: { onCompose: () => void }) => (
    <button onClick={onCompose} aria-label="compose">
      compose
    </button>
  ),
}));

describe("MailSidebarHost sidebar animation", () => {
  const defaultProps = {
    desktopSidebarOpen: true,
    mobileSidebarOpen: false,
    setMobileSidebarOpen: vi.fn(),
    onCompose: vi.fn(),
  };

  describe("desktop sidebar animation classes", () => {
    it("applies GPU-accelerated translate-x-0 when open", () => {
      const { container } = render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen />
      );
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("class")).toContain("translate-x-0");
      expect(sidebar.getAttribute("class")).toContain("opacity-100");
      expect(sidebar.getAttribute("class")).toContain("transition-[transform,opacity]");
      expect(sidebar.getAttribute("class")).toContain("duration-200");
      expect(sidebar.getAttribute("class")).toContain("ease-out");
    });

    it("applies -translate-x-full and opacity-0 when collapsed", () => {
      const { container } = render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />
      );
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("class")).toContain("-translate-x-full");
      expect(sidebar.getAttribute("class")).toContain("opacity-0");
    });

    it("includes motion-reduce override class", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("class")).toContain("motion-reduce:duration-0");
    });

    it("has will-change-transform for GPU acceleration", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("class")).toContain("will-change-transform");
    });
  });

  describe("accessibility", () => {
    it("sets aria-hidden=true when collapsed", () => {
      const { container } = render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />
      );
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("aria-hidden")).toBe("true");
    });

    it("sets aria-hidden=false when open", () => {
      const { container } = render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen />
      );
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar.getAttribute("aria-hidden")).toBe("false");
    });
  });

  describe("NovaMailIconRail visibility", () => {
    it("renders icon rail when sidebar is collapsed", () => {
      render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />
      );
      expect(
        screen.getByRole("button", { name: /compose/i })
      ).toBeDefined();
    });

    it("hides icon rail when sidebar is open", () => {
      const { container } = render(
        <MailSidebarHost {...defaultProps} desktopSidebarOpen />
      );
      expect(
        container.querySelector("button[aria-label=\"compose\"]")
      ).toBeNull();
    });
  });
});
