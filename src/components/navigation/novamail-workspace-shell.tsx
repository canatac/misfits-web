"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChatPanel } from "@/components/mail/chat-panel";
import { TerminalConsole } from "@/components/mail/terminal-console";
import { VscodeLayoutControls } from "@/components/mail/vscode-layout-controls";
import { MailSidebar } from "@/components/mail/sidebar";
import { NovaMailIconRail } from "@/components/mail/novamail-icon-rail";
import { NovamailShellHeader } from "@/components/navigation/novamail-shell-header";
import { useChatStore } from "@/stores/chat-store";
import { useMailLayoutStore } from "@/stores/mail-layout-store";

interface NovamailWorkspaceShellProps {
  children: ReactNode;
  contentClassName?: string;
}

export function NovamailWorkspaceShell({ children, contentClassName }: NovamailWorkspaceShellProps) {
  const router = useRouter();

  const [activeVibe, setActiveVibe] = useState("Formal");

  const hydrated = useMailLayoutStore((s) => s.hydrated);
  const desktopSidebarOpen = useMailLayoutStore((s) => s.desktopSidebarOpen);
  const toggleDesktopSidebar = useMailLayoutStore((s) => s.toggleDesktopSidebar);
  const desktopHeaderOpen = useMailLayoutStore((s) => s.desktopHeaderOpen);
  const toggleDesktopHeader = useMailLayoutStore((s) => s.toggleDesktopHeader);
  const desktopConsoleOpen = useMailLayoutStore((s) => s.desktopConsoleOpen);
  const setDesktopConsoleOpen = useMailLayoutStore((s) => s.setDesktopConsoleOpen);
  const toggleDesktopConsole = useMailLayoutStore((s) => s.toggleDesktopConsole);
  const desktopChatOpen = useMailLayoutStore((s) => s.desktopChatOpen);
  const setDesktopChatOpen = useMailLayoutStore((s) => s.setDesktopChatOpen);
  const setChatOpen = useChatStore((s) => s.setOpen);

  const toggleRightPanel = () => {
    const next = !desktopChatOpen;
    setDesktopChatOpen(next);
    setChatOpen(next);
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-[#09090B]" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#09090B] text-[#E4E4E7]">
      {desktopHeaderOpen && (
        <NovamailShellHeader
          onOpenSearch={() => router.push("/mail")}
          isSidebarCollapsed={!desktopSidebarOpen}
          onToggleSidebar={toggleDesktopSidebar}
          isHeaderCollapsed={!desktopHeaderOpen}
          onToggleHeader={toggleDesktopHeader}
          isBottomConsoleOpen={desktopConsoleOpen}
          onToggleBottomConsole={toggleDesktopConsole}
          isRightPanelOpen={desktopChatOpen}
          onToggleRightPanel={toggleRightPanel}
          activeVibe={activeVibe}
          onChangeVibe={setActiveVibe}
        />
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {!desktopHeaderOpen && (
          <div className="absolute right-3 top-3 z-30 hidden lg:block">
            <VscodeLayoutControls
              isSidebarCollapsed={!desktopSidebarOpen}
              onToggleSidebar={toggleDesktopSidebar}
              isHeaderCollapsed={!desktopHeaderOpen}
              onToggleHeader={toggleDesktopHeader}
              isBottomConsoleOpen={desktopConsoleOpen}
              onToggleBottomConsole={toggleDesktopConsole}
              isRightPanelOpen={desktopChatOpen}
              onToggleRightPanel={toggleRightPanel}
            />
          </div>
        )}

        {!desktopSidebarOpen && <NovaMailIconRail onCompose={() => router.push("/mail")} />}
        <div
          className={cn(
            "hidden h-full shrink-0 overflow-hidden border-r border-[#242427] bg-[#101012]/95 transition-all duration-200 ease-out lg:block",
            desktopSidebarOpen ? "lg:w-80" : "lg:w-0",
          )}
        >
          {desktopSidebarOpen && <MailSidebar onCompose={() => router.push("/compose")} className="h-full" />}
        </div>

        <main
          className={cn(
            "flex-1 overflow-y-auto p-4 transition-[padding] duration-200 md:p-6",
            contentClassName,
            desktopConsoleOpen && "pb-[18rem]",
          )}
        >
          {children}
        </main>

        <div
          className={cn(
            "hidden h-full shrink-0 overflow-hidden border-l border-[#202024] bg-[#101012]/90 shadow-2xl transition-all duration-200 ease-out lg:block",
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

      <TerminalConsole isOpen={desktopConsoleOpen} onClose={() => setDesktopConsoleOpen(false)} />
    </div>
  );
}
