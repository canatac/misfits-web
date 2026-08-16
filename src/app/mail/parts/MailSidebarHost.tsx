"use client";

import { MailSidebar } from "@/components/mail/sidebar";
import { NovaMailIconRail } from "@/components/mail/novamail-icon-rail";
import { cn } from "@/lib/utils";

export interface MailSidebarHostProps {
  desktopSidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  onCompose: () => void;
}

export function MailSidebarHost({
  desktopSidebarOpen,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  onCompose,
}: MailSidebarHostProps) {
  return (
    <>
      {!desktopSidebarOpen && <NovaMailIconRail onCompose={onCompose} />}

      <div
        className={cn(
          "hidden h-full shrink-0 overflow-hidden rounded-2xl border border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
          desktopSidebarOpen ? "lg:w-64" : "lg:w-0"
        )}
      >
        {desktopSidebarOpen && (
          <MailSidebar onCompose={onCompose} className="lg:pt-12" />
        )}
      </div>

      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-overlay)] lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 h-full w-64 lg:hidden">
            <MailSidebar onCompose={onCompose} />
          </div>
        </>
      )}
    </>
  );
}
