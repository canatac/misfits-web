"use client";

/**
 * Mail page — composes Sidebar + EmailList + EmailView.
 * 3-column responsive: lg: 3 columns, md: 2 columns, mobile: 1 column.
 * Wires up keyboard shortcuts and mobile navigation.
 * Opens the email composer in a modal when Compose is clicked or 'c' pressed.
 */
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VscodeLayoutControls } from "@/components/mail/vscode-layout-controls";
import { NovamailShellHeader } from "@/components/navigation/novamail-shell-header";
import { WorkspaceBuildFooter } from "@/components/navigation/workspace-build-footer";
import { useMailShortcuts } from "@/hooks/use-mail-shortcuts";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useThreads } from "@/hooks/use-threads";
import { useComposerStore } from "@/stores/composer-store";
import { useAccountStore } from "@/stores/account-store";
import { useChatStore } from "@/stores/chat-store";
import { MobileTopBar } from "./parts/MobileTopBar";
import { MailSidebarHost } from "./parts/MailSidebarHost";
import { MailWorkspace } from "./parts/MailWorkspace";
import { MailPageOverlays } from "./parts/MailPageOverlays";
import { useMailLayoutSelectors } from "./parts/useMailLayoutSelectors";
import { useMailPageHandlers } from "./parts/useMailPageHandlers";

type MobileView = "list" | "view";

export default function MailPage() {
  const router = useRouter();
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeVibe, setActiveVibe] = useState("Formal");

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const hasSelectedEmailInList = useEmailStore((s) =>
    Boolean(s.selectedEmailId && s.emails.some((e) => e.id === s.selectedEmailId))
  );
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const setAccountId = useEmailStore((s) => s.setAccountId);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const selectThread = useThreadStore((s) => s.selectThread);
  const hasDesktopSelection = hasSelectedEmailInList;

  const isUnifiedInbox = useAccountStore((s) => s.isUnifiedInbox);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const accountsCount = useAccountStore((s) => s.accounts.length);
  const toggleUnifiedInbox = useAccountStore((s) => s.toggleUnifiedInbox);
  const canToggleUnified = accountsCount > 1;

  const {
    desktopSidebarOpen,
    setDesktopSidebarOpen,
    toggleDesktopSidebar,
    desktopChatOpen,
    setDesktopChatOpen,
    desktopHeaderOpen,
    toggleDesktopHeader,
    desktopConsoleOpen,
    setDesktopConsoleOpen,
    toggleDesktopConsole,
  } = useMailLayoutSelectors();

  const chatOpen = useChatStore((s) => s.isOpen);
  const setChatOpen = useChatStore((s) => s.setOpen);
  const toggleChatOpen = useChatStore((s) => s.toggleOpen);

  useEffect(() => {
    setAccountId(isUnifiedInbox ? null : activeAccountId);
  }, [isUnifiedInbox, activeAccountId, setAccountId]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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

  const threadingEnabled = useThreadStore((s) => s.threadingEnabled);
  const viewMode = useThreadStore((s) => s.viewMode);
  const threads = useThreads();
  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  useEffect(() => {
    if (selectedEmailId && window.innerWidth < 1024) {
      setMobileView("view");
    }
    if (!selectedEmailId && window.innerWidth < 1024) {
      setMobileView("list");
    }
  }, [selectedEmailId]);

  useEffect(() => {
    if (!selectedEmailId && selectedThreadId) {
      selectThread(null);
    }
  }, [selectedEmailId, selectedThreadId, selectThread]);

  useEffect(() => {
    if (selectedEmailId && !hasSelectedEmailInList) {
      selectEmail(null);
    }
  }, [selectedEmailId, hasSelectedEmailInList, selectEmail]);

  const openComposer = useComposerStore((s) => s.openComposer);
  const composerOpen = useComposerStore((s) => s.composerOpen);
  const closeComposer = useComposerStore((s) => s.closeComposer);
  const handleCompose = useCallback(() => {
    openComposer(null);
    router.push("/compose");
  }, [openComposer, router]);

  const {
    handleSearchFocus,
    handleNavNext,
    handleNavPrev,
    handleArchive,
    handleDelete,
    handleClose,
    closeActiveOverlay,
    handleToggleSidebarShortcut,
    handleToggleChatShortcut,
  } = useMailPageHandlers({
    isDesktop,
    chatOpen,
    mobileSidebarOpen,
    desktopChatOpen,
    setChatOpen,
    setMobileSidebarOpen,
    toggleDesktopSidebar,
    setDesktopChatOpen,
    toggleChatOpen,
    selectEmail,
    selectThread,
    setMobileView,
    setSearchOverlayOpen,
  });

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

  const handleToggleRightPanel = () => {
    const next = !desktopChatOpen;
    setDesktopChatOpen(next);
    setChatOpen(next);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090B] text-[#E4E4E7]">
      <MobileTopBar
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        isUnifiedInbox={isUnifiedInbox}
        canToggleUnified={canToggleUnified}
        toggleUnifiedInbox={toggleUnifiedInbox}
      />

      {desktopHeaderOpen && (
        <NovamailShellHeader
          onOpenSearch={handleSearchFocus}
          isSidebarCollapsed={!desktopSidebarOpen}
          onToggleSidebar={toggleDesktopSidebar}
          isHeaderCollapsed={!desktopHeaderOpen}
          onToggleHeader={toggleDesktopHeader}
          isBottomConsoleOpen={desktopConsoleOpen}
          onToggleBottomConsole={toggleDesktopConsole}
          isRightPanelOpen={desktopChatOpen}
          onToggleRightPanel={handleToggleRightPanel}
          activeVibe={activeVibe}
          onChangeVibe={setActiveVibe}
        />
      )}

      <div
        className={cn(
          "relative flex min-h-0 w-full flex-1 overflow-hidden p-2 lg:p-3"
        )}
      >
        {!desktopHeaderOpen && (
          <div className="absolute top-3 right-3 z-30 hidden lg:block">
            <VscodeLayoutControls
              isSidebarCollapsed={!desktopSidebarOpen}
              onToggleSidebar={toggleDesktopSidebar}
              isHeaderCollapsed={!desktopHeaderOpen}
              onToggleHeader={toggleDesktopHeader}
              isBottomConsoleOpen={desktopConsoleOpen}
              onToggleBottomConsole={toggleDesktopConsole}
              isRightPanelOpen={desktopChatOpen}
              onToggleRightPanel={handleToggleRightPanel}
            />
          </div>
        )}

        <MailSidebarHost
          desktopSidebarOpen={desktopSidebarOpen}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          onCompose={handleCompose}
        />

        <MailWorkspace
          mobileView={mobileView}
          hasDesktopSelection={hasDesktopSelection}
          threadingEnabled={threadingEnabled}
          selectedThread={selectedThread}
          viewMode={viewMode}
          desktopChatOpen={desktopChatOpen}
          onCloseDetail={() => {
            selectThread(null);
            selectEmail(null);
            setMobileView("list");
          }}
          onCloseChat={() => {
            setDesktopChatOpen(false);
            setChatOpen(false);
          }}
        />
      </div>

      <WorkspaceBuildFooter className="shrink-0 border-[#242427] bg-[#0A0A0B]/95 px-3 pb-2" />

      <MailPageOverlays
        composerOpen={composerOpen}
        closeComposer={closeComposer}
        searchOverlayOpen={searchOverlayOpen}
        setSearchOverlayOpen={setSearchOverlayOpen}
        isDesktop={isDesktop}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        desktopConsoleOpen={desktopConsoleOpen}
        setDesktopConsoleOpen={setDesktopConsoleOpen}
      />
    </div>
  );
}
