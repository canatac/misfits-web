import { render, screen } from "@testing-library/react";
import { MailSidebarHost } from "../MailSidebarHost";

describe("MailSidebarHost sidebar animation", () => {
  const defaultProps = {
    desktopSidebarOpen: true,
    mobileSidebarOpen: false,
    setMobileSidebarOpen: jest.fn(),
    onCompose: jest.fn(),
  };

  describe("desktop sidebar animation classes", () => {
    it("applies GPU-accelerated translate-x-0 when open", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} desktopSidebarOpen />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveClass("translate-x-0", "opacity-100");
      expect(sidebar).toHaveClass("transition-[transform,opacity]");
      expect(sidebar).toHaveClass("duration-200");
      expect(sidebar).toHaveClass("ease-out");
    });

    it("applies -translate-x-full and opacity-0 when collapsed", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveClass("-translate-x-full", "opacity-0");
    });

    it("includes motion-reduce override class", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveClass("motion-reduce:duration-0");
    });

    it("has will-change-transform for GPU acceleration", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveClass("will-change-transform");
    });
  });

  describe("accessibility", () => {
    it("sets aria-hidden=true when collapsed", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveAttribute("aria-hidden", "true");
    });

    it("sets aria-hidden=false when open", () => {
      const { container } = render(<MailSidebarHost {...defaultProps} desktopSidebarOpen />);
      const sidebar = container.querySelector('[aria-hidden]') as HTMLElement;
      expect(sidebar).toHaveAttribute("aria-hidden", "false");
    });
  });

  describe("NovaMailIconRail visibility", () => {
    it("renders icon rail when sidebar is collapsed", () => {
      render(<MailSidebarHost {...defaultProps} desktopSidebarOpen={false} />);
      expect(screen.getByRole("button", { name: /compose/i })).toBeInTheDocument();
    });

    it("hides icon rail when sidebar is open", () => {
      render(<MailSidebarHost {...defaultProps} desktopSidebarOpen />);
      expect(screen.queryByRole("button", { name: /compose/i })).not.toBeInTheDocument();
    });
  });
});
