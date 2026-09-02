"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { VscodeLayoutControls } from "@/components/mail/vscode-layout-controls";

interface NovamailShellHeaderProps {
  onOpenSearch: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isHeaderCollapsed: boolean;
  onToggleHeader: () => void;
  isBottomConsoleOpen: boolean;
  onToggleBottomConsole: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  activeVibe: string;
  onChangeVibe: (vibe: string) => void;
}

const VIBES = ["Formal", "Casual", "Concise"] as const;

export function NovamailShellHeader({
  onOpenSearch,
  isSidebarCollapsed,
  onToggleSidebar,
  isHeaderCollapsed,
  onToggleHeader,
  isBottomConsoleOpen,
  onToggleBottomConsole,
  isRightPanelOpen,
  onToggleRightPanel,
  activeVibe,
  onChangeVibe,
}: NovamailShellHeaderProps) {
  const router = useRouter();
  const [showVibeDropdown, setShowVibeDropdown] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fallbackName = useMemo(() => {
    if (user?.displayName && user.displayName.trim().length > 0)
      return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  }, [user?.displayName, user?.email]);

  const initials = useMemo(() => {
    const source = fallbackName.trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }, [fallbackName]);

  return (
    <div className="sticky top-0 z-40 hidden border-b border-[#242427] bg-[#0A0A0B]/90 px-4 py-3 text-[#E0E0E0] backdrop-blur lg:block">
      <div className="mx-auto flex max-w-[1920px] items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex shrink-0 items-center gap-2 border-r border-[#242427] pr-2.5 pl-2"
          title="Misfits Mail - Dashboard Matinal"
          aria-label="Ouvrir le dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C49B66]/80 bg-[#121214] shadow-lg shadow-[#C49B66]/10 transition-transform hover:scale-105">
            <span className="font-serif text-xl leading-none font-extrabold tracking-tight text-[#C49B66]">
              M
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="group ml-1 flex flex-1 items-center gap-2 rounded-xl border border-[#242427] bg-[#121214] px-3 py-2 text-left text-sm text-[#A1A1AA] hover:border-[#C49B66]/60"
        >
          <Search className="h-4 w-4 text-[#71717A] group-hover:text-[#C49B66]" />
          <span className="flex-1">
            Rechercher (from:, subject:, has:attachment...)
          </span>
          <span className="rounded-lg bg-[#1D1D20] p-1 text-[#71717A]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </span>
          <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1.5 py-0.5 text-[10px] text-[#71717A]">
            ⌘K / Ctrl+K
          </kbd>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowVibeDropdown((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-[#242427] bg-[#121214] px-3 py-2 text-xs font-medium text-white transition-all hover:border-[#C49B66]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#C49B66]" />
            <span>
              Vibe: <strong className="text-[#C49B66]">{activeVibe}</strong>
            </span>
            <ChevronDown className="ml-0.5 h-3 w-3 text-[#71717A]" />
          </button>
          {showVibeDropdown && (
            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-40 rounded-xl border border-[#242427] bg-[#121214] p-1 shadow-2xl">
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[#71717A] uppercase">
                Select Draft Vibe
              </div>
              {VIBES.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => {
                    onChangeVibe(vibe);
                    setShowVibeDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    activeVibe === vibe
                      ? "border border-[#242427] bg-[#1D1D20] font-medium text-white"
                      : "text-[#E0E0E0] hover:bg-[#1D1D20]/60"
                  }`}
                >
                  <span>{vibe}</span>
                  {activeVibe === vibe && (
                    <span className="font-bold text-[#C49B66]">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/security")}
          className="group flex shrink-0 items-center gap-2 border-l border-[#242427] pl-2 transition-opacity hover:opacity-85"
          title="Gestion du Compte & Sécurité"
          aria-label="Gestion du Compte & Sécurité"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#C49B66] p-0.5 transition-transform group-hover:scale-105">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={fallbackName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1D1D20] text-xs font-bold text-[#C49B66]">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden text-left xl:flex xl:flex-col">
            <span className="flex items-center gap-1 text-xs leading-tight font-semibold text-white">
              {fallbackName}
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] leading-tight text-[#71717A]">
              {user?.email ?? "—"}
            </span>
          </div>
        </button>

        <VscodeLayoutControls
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          isHeaderCollapsed={isHeaderCollapsed}
          onToggleHeader={onToggleHeader}
          isBottomConsoleOpen={isBottomConsoleOpen}
          onToggleBottomConsole={onToggleBottomConsole}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={onToggleRightPanel}
        />
      </div>
    </div>
  );
}
