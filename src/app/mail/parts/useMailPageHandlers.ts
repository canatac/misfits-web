"use client";

import { useCallback } from "react";

interface HandlerArgs {
  isDesktop: boolean;
  chatOpen: boolean;
  mobileSidebarOpen: boolean;
  desktopChatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  setMobileSidebarOpen: (updater: boolean | ((v: boolean) => boolean)) => void;
  toggleDesktopSidebar: () => void;
  setDesktopChatOpen: (v: boolean) => void;
  toggleChatOpen: () => void;
  selectEmail: (id: string | null) => void;
  selectThread: (id: string | null) => void;
  setMobileView: (v: "list" | "view") => void;
  setSearchOverlayOpen: (v: boolean) => void;
}

type WinFn = "__mailNavNext" | "__mailNavPrev" | "__mailArchive" | "__mailDelete";
const winCall = (key: WinFn) => {
  (window as Window & Partial<Record<WinFn, () => void>>)[key]?.();
};

export function useMailPageHandlers(args: HandlerArgs) {
  const {
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
  } = args;

  const handleSearchFocus = useCallback(
    () => setSearchOverlayOpen(true),
    [setSearchOverlayOpen]
  );
  const handleNavNext = useCallback(() => winCall("__mailNavNext"), []);
  const handleNavPrev = useCallback(() => winCall("__mailNavPrev"), []);
  const handleArchive = useCallback(() => winCall("__mailArchive"), []);
  const handleDelete = useCallback(() => winCall("__mailDelete"), []);

  const handleClose = useCallback(() => {
    selectEmail(null);
    selectThread(null);
    setMobileView("list");
  }, [selectEmail, selectThread, setMobileView]);

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
  }, [chatOpen, isDesktop, mobileSidebarOpen, setChatOpen, setMobileSidebarOpen]);

  const handleToggleSidebarShortcut = useCallback(() => {
    if (isDesktop) {
      toggleDesktopSidebar();
      return;
    }
    setMobileSidebarOpen((v: boolean) => !v);
  }, [isDesktop, toggleDesktopSidebar, setMobileSidebarOpen]);

  const handleToggleChatShortcut = useCallback(() => {
    if (isDesktop) {
      const next = !desktopChatOpen;
      setDesktopChatOpen(next);
      setChatOpen(next);
      return;
    }
    toggleChatOpen();
  }, [desktopChatOpen, isDesktop, setChatOpen, setDesktopChatOpen, toggleChatOpen]);

  return {
    handleSearchFocus,
    handleNavNext,
    handleNavPrev,
    handleArchive,
    handleDelete,
    handleClose,
    closeActiveOverlay,
    handleToggleSidebarShortcut,
    handleToggleChatShortcut,
  };
}
