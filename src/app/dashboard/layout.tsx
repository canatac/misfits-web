"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { DashboardLeftRail } from "@/components/dashboard/dashboard-left-rail";
import { NovamailShellHeader } from "@/components/navigation/novamail-shell-header";
import { VscodeLayoutControls } from "@/components/mail/vscode-layout-controls";
import { useMailLayoutStore } from "@/stores/mail-layout-store";
import { useChatStore } from "@/stores/chat-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeVibe, setActiveVibe] = useState("Formal");

  const desktopSidebarOpen = useMailLayoutStore((s) => s.desktopSidebarOpen);
  const toggleDesktopSidebar = useMailLayoutStore((s) => s.toggleDesktopSidebar);
  const desktopHeaderOpen = useMailLayoutStore((s) => s.desktopHeaderOpen);
  const toggleDesktopHeader = useMailLayoutStore((s) => s.toggleDesktopHeader);
  const desktopConsoleOpen = useMailLayoutStore((s) => s.desktopConsoleOpen);
  const toggleDesktopConsole = useMailLayoutStore((s) => s.toggleDesktopConsole);
  const desktopChatOpen = useMailLayoutStore((s) => s.desktopChatOpen);
  const setDesktopChatOpen = useMailLayoutStore((s) => s.setDesktopChatOpen);
  const setChatOpen = useChatStore((s) => s.setOpen);

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
          onToggleRightPanel={() => {
            const next = !desktopChatOpen;
            setDesktopChatOpen(next);
            setChatOpen(next);
          }}
          activeVibe={activeVibe}
          onChangeVibe={setActiveVibe}
        />
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {!desktopHeaderOpen && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-30 hidden lg:block">
            <div className="mx-auto flex max-w-[1920px] items-center gap-3">
              <div className="pointer-events-auto flex items-center gap-2 border-r border-[#242427] pl-2 pr-2.5 animate-in fade-in duration-200">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#C49B66]/60 bg-[#1D1D20] font-serif text-[10px] font-bold text-[#C49B66]">
                  M
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/mail")}
                className="pointer-events-auto group ml-2 flex flex-1 items-center gap-2 rounded-xl border border-[#242427] bg-[#121214] px-3 py-2 text-left text-sm text-[#A1A1AA] hover:border-[#C49B66]/60"
              >
                <Search className="h-4 w-4 text-[#71717A] group-hover:text-[#C49B66]" />
                <span className="flex-1">Rechercher (from:, subject:, has:attachment...)</span>
                <span className="rounded-lg bg-[#1D1D20] p-1 text-[#71717A]">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </span>
                <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1.5 py-0.5 text-[10px] text-[#71717A]">⌘K</kbd>
              </button>
              <div className="pointer-events-auto">
                <VscodeLayoutControls
                  isSidebarCollapsed={!desktopSidebarOpen}
                  onToggleSidebar={toggleDesktopSidebar}
                  isHeaderCollapsed={!desktopHeaderOpen}
                  onToggleHeader={toggleDesktopHeader}
                  isBottomConsoleOpen={desktopConsoleOpen}
                  onToggleBottomConsole={toggleDesktopConsole}
                  isRightPanelOpen={desktopChatOpen}
                  onToggleRightPanel={() => {
                    const next = !desktopChatOpen;
                    setDesktopChatOpen(next);
                    setChatOpen(next);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {desktopSidebarOpen && <DashboardLeftRail />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1500px] space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
