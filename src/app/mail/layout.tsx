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
      className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)]"
      data-testid="mail-layout"
    >
      {children}
    </div>
  );
}
