/**
 * Mail layout — 3-column responsive layout.
 * lg (≥1024px): Sidebar | EmailList | EmailView (all visible)
 * md (768px–1023px): EmailList | EmailView (sidebar hidden, toggle button)
 * default (<768px): single column with navigation
 */
import type { ReactNode } from "react";

export default function MailLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#09090B] text-[#E4E4E7]"
      data-testid="mail-layout"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_480px_at_80%_-10%,rgba(196,155,102,0.12),transparent),radial-gradient(900px_360px_at_-10%_20%,rgba(59,91,255,0.12),transparent)]" />
      <div className="relative flex min-h-0 w-full flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
