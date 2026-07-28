"use client";

/**
 * Mail page — composes Sidebar + EmailList + EmailView.
 * 3-column responsive: lg: 3 columns, md: 2 columns, mobile: 1 column.
 * Wires up keyboard shortcuts and mobile navigation.
 */
import { useState, useCallback, useEffect } from "react";
import { Menu, X, Mail as MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MailSidebar } from "@/components/mail/sidebar";
import { EmailList } from "@/components/mail/email-list";
import { EmailView } from "@/components/mail/email-view";
import { useMailShortcuts } from "@/hooks/use-mail-shortcuts";
import { useEmailStore } from "@/stores/email-store";

type MobileView = "list" | "view";

export default function MailPage() {
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);

  // When an email is selected on mobile, switch to view
  useEffect(() => {
    if (selectedEmailId && window.innerWidth < 1024) {
      setMobileView("view");
    }
    if (!selectedEmailId && window.innerWidth < 1024) {
      setMobileView("list");
    }
  }, [selectedEmailId]);

  // Compose handler (placeholder for future issue)
  const handleCompose = useCallback(() => {
    window.alert("Compose window — coming soon!");
  }, []);

  // Keyboard shortcut handlers (delegate to EmailList via window hooks)
  const handleSearchFocus = useCallback(() => {
    const w = window as Window & { __mailFocusSearch?: () => void };
    w.__mailFocusSearch?.();
  }, []);

  const handleNavNext = useCallback(() => {
    const w = window as Window & { __mailNavNext?: () => void };
    w.__mailNavNext?.();
  }, []);

  const handleNavPrev = useCallback(() => {
    const w = window as Window & { __mailNavPrev?: () => void };
    w.__mailNavPrev?.();
  }, []);

  const handleArchive = useCallback(() => {
    const w = window as Window & { __mailArchive?: () => void };
    w.__mailArchive?.();
  }, []);

  const handleDelete = useCallback(() => {
    const w = window as Window & { __mailDelete?: () => void };
    w.__mailDelete?.();
  }, []);

  const handleClose = useCallback(() => {
    selectEmail(null);
    setMobileView("list");
  }, [selectEmail]);

  useMailShortcuts({
    onNext: handleNavNext,
    onPrev: handleNavPrev,
    onArchive: handleArchive,
    onDelete: handleDelete,
    onCompose: handleCompose,
    onSearchFocus: handleSearchFocus,
    onClose: handleClose,
  });

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <MailIcon className="h-5 w-5 text-[var(--color-brand-500)]" />
          <span className="font-semibold">misfits.ai Mail</span>
        </div>
        <div className="w-10" />
      </div>

      {/* 3-column layout */}
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar — persistent on desktop, slide-over on mobile */}
        <div className="hidden h-full shrink-0 lg:block lg:w-64">
          <MailSidebar onCompose={handleCompose} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[var(--color-overlay)] lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 z-50 h-full w-64 lg:hidden">
              <MailSidebar onCompose={handleCompose} />
            </div>
          </>
        )}

        {/* Email list — visible on lg, and on mobile when mobileView === "list" */}
        <div
          className={cn(
            "h-full w-full overflow-hidden lg:w-80 xl:w-96",
            mobileView === "list" ? "block" : "hidden lg:block",
          )}
        >
          <EmailList />
        </div>

        {/* Email view — visible on lg, and on mobile when mobileView === "view" */}
        <div
          className={cn(
            "h-full flex-1 overflow-hidden",
            mobileView === "view" ? "block" : "hidden lg:block",
          )}
        >
          <EmailView />
        </div>
      </div>
    </>
  );
}
