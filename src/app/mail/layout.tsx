/**
 * Mail layout — 3-column responsive layout.
 * lg (≥1024px): Sidebar | EmailList | EmailView (all visible)
 * md (768px–1023px): EmailList | EmailView (sidebar hidden, toggle button)
 * default (<768px): single column with navigation
 */
import type { ReactNode } from "react";
import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function MailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--color-bg)]" data-testid="mail-layout">
      <AppSwitcher />
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
