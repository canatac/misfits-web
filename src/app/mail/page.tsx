"use client";

/**
 * Mail page — composes Sidebar + EmailList + EmailView.
 * 3-column responsive: lg: 3 columns, md: 2 columns, mobile: 1 column.
 * Wires up keyboard shortcuts and mobile navigation.
 * Opens the email composer in a modal when Compose is clicked or 'c' pressed.
 */
import { useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Mail as MailIcon,
  Menu,
  MessageSquare,
  PanelLeft,
  PanelRight,
  PenSquare,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MailSidebar } from "@/components/mail/sidebar";
import { EmailList } from "@/components/mail/email-list";
import { EmailView } from "@/components/mail/email-view";
import { ThreadView } from "@/components/mail/thread-view";
import { ComposerPanel } from "@/components/mail/composer-panel";
import { SearchOverlay } from "@/components/mail/search-overlay";
import { ChatPanel } from "@/components/mail/chat-panel";
import { ChatTrigger } from "@/components/mail/chat-trigger";
import { ReminderBanner } from "@/components/mail/reminder-banner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from "@/components/ui/modal";
import { useMailShortcuts } from "@/hooks/use-mail-shortcuts";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useThreads } from "@/hooks/use-threads";
import { useComposerStore } from "@/stores/composer-store";
import { useAccountStore } from "@/stores/account-store";
import { useChatStore } from "@/stores/chat-store";
import { useMailLayoutStore } from "@/stores/mail-layout-store";
import { useI18n } from "@/i18n/provider";

type MobileView = "list" | "view";

export default function MailPage() {
  const { t } = useI18n();
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const setAccountId = useEmailStore((s) => s.setAccountId);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const hasDesktopSelection = Boolean(selectedEmailId || selectedThreadId);

  // Multi-account state (Issue #154): sync account store → email store filter.
  const isUnifiedInbox = useAccountStore((s) => s.isUnifiedInbox);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const accountsCount = useAccountStore((s) => s.accounts.length);
  const toggleUnifiedInbox = useAccountStore((s) => s.toggleUnifiedInbox);
  const canToggleUnified = accountsCount > 1;

  // Desktop layout state (persistent)
  const desktopSidebarOpen = useMailLayoutStore((s) => s.desktopSidebarOpen);
  const setDesktopSidebarOpen = useMailLayoutStore((s) => s.setDesktopSidebarOpen);
  const toggleDesktopSidebar = useMailLayoutStore((s) => s.toggleDesktopSidebar);
  const desktopChatOpen = useMailLayoutStore((s) => s.desktopChatOpen);
  const setDesktopChatOpen = useMailLayoutStore((s) => s.setDesktopChatOpen);
  const toggleDesktopChat = useMailLayoutStore((s) => s.toggleDesktopChat);

  // Chat global open state
  const chatOpen = useChatStore((s) => s.isOpen);
  const setChatOpen = useChatStore((s) => s.setOpen);
  const toggleChatOpen = useChatStore((s) => s.toggleOpen);

  // When the active account / unified toggle changes, update the email filter.
  useEffect(() => {
    setAccountId(isUnifiedInbox ? null : activeAccountId);
  }, [isUnifiedInbox, activeAccountId, setAccountId]);

  // Desktop breakpoint tracking.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Keep ChatPanel mode aligned with viewport/layout state.
  useEffect(() => {
    if (isDesktop) {
      setChatOpen(desktopChatOpen);
      return;
    }
    setDesktopSidebarOpen(true);
  }, [isDesktop, desktopChatOpen, setChatOpen, setDesktopSidebarOpen]);

  useEffect(() => {
    if (!isDesktop) return;
    if (chatOpen !== desktopChatOpen) {
      setDesktopChatOpen(chatOpen);
    }
  }, [chatOpen, desktopChatOpen, isDesktop, setDesktopChatOpen]);


  // Threading state
  const threadingEnabled = useThreadStore((s) => s.threadingEnabled);
  const viewMode = useThreadStore((s) => s.viewMode);
  const threads = useThreads();
  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  // When an email is selected on mobile, switch to view
  useEffect(() => {
    if (selectedEmailId && window.innerWidth < 1024) {
      setMobileView("view");
    }
    if (!selectedEmailId && window.innerWidth < 1024) {
      setMobileView("list");
    }
  }, [selectedEmailId]);

  // Compose handler — opens the composer modal (fresh draft).
  const openComposer = useComposerStore((s) => s.openComposer);
  const composerOpen = useComposerStore((s) => s.composerOpen);
  const closeComposer = useComposerStore((s) => s.closeComposer);
  const handleCompose = useCallback(() => {
    openComposer(null);
  }, [openComposer]);

  // Keyboard shortcut handlers (delegate to EmailList via window hooks)
  const handleSearchFocus = useCallback(() => {
    setSearchOverlayOpen(true);
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

  const closeActiveOverlay = useCallback(() => {
    if (isDesktop) return false;
    if (chatOpen) {
      setChatOpen(false);
      return true;
    }
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
      return true;
    }
    return false;
  }, [chatOpen, isDesktop, mobileSidebarOpen, setChatOpen]);

  const handleToggleSidebarShortcut = useCallback(() => {
    if (isDesktop) {
      toggleDesktopSidebar();
      return;
    }
    setMobileSidebarOpen((v) => !v);
  }, [isDesktop, toggleDesktopSidebar]);

  const handleToggleChatShortcut = useCallback(() => {
    if (isDesktop) {
      const next = !desktopChatOpen;
      setDesktopChatOpen(next);
      setChatOpen(next);
      return;
    }
    toggleChatOpen();
  }, [desktopChatOpen, isDesktop, setChatOpen, setDesktopChatOpen, toggleChatOpen]);

  const openChatPanel = useCallback(() => {
    if (isDesktop) {
      setDesktopChatOpen(true);
      setChatOpen(true);
      return;
    }
    setChatOpen(true);
  }, [isDesktop, setChatOpen, setDesktopChatOpen]);

  useMailShortcuts({
    onNext: handleNavNext,
    onPrev: handleNavPrev,
    onArchive: handleArchive,
    onDelete: handleDelete,
    onCompose: handleCompose,
    onSearchFocus: handleSearchFocus,
    onClose: handleClose,
    onToggleSidebar: handleToggleSidebarShortcut,
    onToggleChat: handleToggleChatShortcut,
    onCloseOverlay: closeActiveOverlay,
  });

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-[#242427] bg-[#111113]/95 px-3 py-2.5 text-[#E4E4E7] backdrop-blur-xl lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Ouvrir/fermer le menu"
          title={mobileSidebarOpen ? "Replier le menu" : "Afficher le menu"}
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <MailIcon className="h-5 w-5 text-[#C49B66]" />
          <span className="font-semibold">misfits.ai Mail</span>
        </div>
        {/* Unified inbox toggle (mobile) — Issue #154 */}
        <label className="flex items-center gap-1.5 text-xs" title="Toggle unified inbox">
          <Layers className="h-4 w-4 text-[var(--color-brand-500)]" />
          <Switch
            checked={isUnifiedInbox}
            disabled={!canToggleUnified}
            onCheckedChange={toggleUnifiedInbox}
            aria-label="Toggle unified inbox"
          />
        </label>
      </div>

      {/* Desktop navigation (NovaMail-style) */}
      <div className="hidden border-b border-[#242427] bg-[#0A0A0B]/90 px-4 py-3 text-[#E0E0E0] backdrop-blur lg:block">
        <div className="mx-auto flex max-w-[1920px] items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C49B66]/80 bg-[#121214] text-xl font-extrabold text-[#C49B66] shadow-lg shadow-[#C49B66]/10"
            title="Dashboard mail"
          >
            M
          </button>

          <button
            type="button"
            onClick={handleSearchFocus}
            className="group flex flex-1 items-center gap-2 rounded-xl border border-[#242427] bg-[#121214] px-3 py-2 text-left text-sm text-[#A1A1AA] hover:border-[#C49B66]/60"
          >
            <Search className="h-4 w-4 text-[#71717A] group-hover:text-[#C49B66]" />
            <span className="flex-1">{t("mailShell.searchPlaceholder")}</span>
            <span className="rounded-lg bg-[#1D1D20] p-1 text-[#71717A]">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </span>
            <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1.5 py-0.5 text-[10px] text-[#71717A]">⌘K</kbd>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 rounded-xl border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-[#C49B66] hover:bg-[#1D1D20]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("mailShell.proMode")}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="relative flex h-full w-full overflow-hidden p-2 lg:h-[calc(100%-72px)] lg:p-3">
        {/* Desktop panel toggles */}
        <div className="pointer-events-none absolute left-5 right-5 top-4 z-30 hidden items-center justify-between lg:flex">
          <Button
            variant="ghost"
            size="sm"
            className="pointer-events-auto gap-1 border border-[#2A2A2D] bg-[#121214]/90 text-[#E4E4E7] shadow-xl backdrop-blur hover:bg-[#1A1A1D]"
            onClick={() => toggleDesktopSidebar()}
            aria-label={desktopSidebarOpen ? "Replier le menu" : "Afficher le menu"}
            title={desktopSidebarOpen ? "Replier le menu (⌘/Ctrl+B)" : "Afficher le menu (⌘/Ctrl+B)"}
          >
            <PanelLeft className="h-4 w-4" />
            {desktopSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="pointer-events-auto gap-1 border border-[#2A2A2D] bg-[#121214]/90 text-[#E4E4E7] shadow-xl backdrop-blur hover:bg-[#1A1A1D]"
            onClick={() => {
              const next = !desktopChatOpen;
              setDesktopChatOpen(next);
              setChatOpen(next);
            }}
            aria-label={desktopChatOpen ? "Replier le chat" : "Afficher le chat"}
            title={desktopChatOpen ? "Replier le chat (⌘/Ctrl+J)" : "Afficher le chat (⌘/Ctrl+J)"}
          >
            {desktopChatOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Icônes compactes persistantes quand panneaux repliés */}
        {!desktopSidebarOpen && (
          <div className="absolute left-5 top-16 z-30 hidden flex-col gap-1 rounded-2xl border border-[#2A2A2D] bg-[#121214]/95 p-1.5 shadow-2xl backdrop-blur lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopSidebarOpen(true)}
              aria-label="Afficher le menu"
              title="Afficher le menu (⌘/Ctrl+B)"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCompose}
              aria-label="Nouveau message"
              title="Nouveau message"
            >
              <PenSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchFocus}
              aria-label="Rechercher"
              title="Rechercher"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!desktopChatOpen && (
          <div className="absolute right-5 top-16 z-30 hidden flex-col gap-1 rounded-2xl border border-[#2A2A2D] bg-[#121214]/95 p-1.5 shadow-2xl backdrop-blur lg:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={openChatPanel}
              aria-label="Afficher le chat Hermes"
              title="Afficher le chat Hermes (⌘/Ctrl+J)"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sidebar — desktop docked with smooth collapse */}
        <div
          className={cn(
            "hidden h-full shrink-0 overflow-hidden rounded-2xl border border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
            desktopSidebarOpen ? "lg:w-64" : "lg:w-0",
          )}
        >
          {desktopSidebarOpen && <MailSidebar onCompose={handleCompose} className="lg:pt-12" />}
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-[var(--color-overlay)] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 z-50 h-full w-64 lg:hidden">
              <MailSidebar onCompose={handleCompose} />
            </div>
          </>
        )}

        {/* Email list — desktop: plein écran sans sélection, split après sélection */}
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
            hasDesktopSelection ? "lg:w-80 xl:w-96" : "lg:flex-1",
            !desktopSidebarOpen && "lg:pl-14",
            !desktopChatOpen && !hasDesktopSelection && "lg:pr-14",
            mobileView === "list" ? "block" : "hidden lg:block",
          )}
        >
          <EmailList />
        </div>

        {/* Email view — desktop: visible seulement après sélection */}
        <div
          className={cn(
            "h-full flex-1 overflow-hidden rounded-2xl border border-[#202024] bg-[#0F0F11]/92 shadow-2xl",
            !desktopSidebarOpen && "lg:pl-14",
            !desktopChatOpen && "lg:pr-14",
            mobileView === "view"
              ? hasDesktopSelection
                ? "block lg:block"
                : "block lg:hidden"
              : hasDesktopSelection
                ? "hidden lg:block"
                : "hidden lg:hidden",
          )}
        >
          {threadingEnabled && selectedThread ? (
            <ThreadView thread={selectedThread} viewMode={viewMode} />
          ) : (
            <EmailView />
          )}
        </div>

        {/* Desktop chat panel — docked and independent */}
        <div
          className={cn(
            "hidden h-full shrink-0 overflow-hidden rounded-2xl border border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
            desktopChatOpen ? "lg:w-[34rem]" : "lg:w-0",
          )}
        >
          {desktopChatOpen && (
            <ChatPanel
              layout="docked"
              onRequestClose={() => {
                setDesktopChatOpen(false);
                setChatOpen(false);
              }}
            />
          )}
        </div>
      </div>

      {/* Composer modal */}
      <Modal open={composerOpen} onOpenChange={(o) => { if (!o) closeComposer(); }}>
        <ModalContent className="max-w-3xl gap-0 p-0">
          <ModalHeader className="sr-only">
            <ModalTitle>{t("nav.compose")}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ComposerPanel onClose={closeComposer} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Search overlay */}
      <SearchOverlay open={searchOverlayOpen} onOpenChange={setSearchOverlayOpen} />

      {/* Mobile chat overlay + trigger */}
      {!isDesktop && chatOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-overlay)]"
            onClick={() => setChatOpen(false)}
            aria-hidden="true"
          />
          <ChatPanel layout="overlay" onRequestClose={() => setChatOpen(false)} />
        </>
      )}
      {!isDesktop && <ChatTrigger />}

      {/* Follow-up reminder banner (Issue #151) */}
      <ReminderBanner />
    </>
  );
}
