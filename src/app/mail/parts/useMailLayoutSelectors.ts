"use client";

/**
 * useMailLayoutSelectors — extracts the many mail-layout-store selectors
 * used by MailPage into a single hook to keep the page component slim.
 */
import { useMailLayoutStore } from "@/stores/mail-layout-store";

export function useMailLayoutSelectors() {
  const desktopSidebarOpen = useMailLayoutStore((s) => s.desktopSidebarOpen);
  const setDesktopSidebarOpen = useMailLayoutStore(
    (s) => s.setDesktopSidebarOpen
  );
  const toggleDesktopSidebar = useMailLayoutStore(
    (s) => s.toggleDesktopSidebar
  );
  const desktopChatOpen = useMailLayoutStore((s) => s.desktopChatOpen);
  const setDesktopChatOpen = useMailLayoutStore((s) => s.setDesktopChatOpen);
  const desktopHeaderOpen = useMailLayoutStore((s) => s.desktopHeaderOpen);
  const toggleDesktopHeader = useMailLayoutStore((s) => s.toggleDesktopHeader);
  const desktopConsoleOpen = useMailLayoutStore((s) => s.desktopConsoleOpen);
  const setDesktopConsoleOpen = useMailLayoutStore(
    (s) => s.setDesktopConsoleOpen
  );
  const toggleDesktopConsole = useMailLayoutStore(
    (s) => s.toggleDesktopConsole
  );
  return {
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
  };
}
