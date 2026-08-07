"use client";

import { PanelBottom, PanelLeft, PanelRight, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VscodeLayoutControlsProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isHeaderCollapsed: boolean;
  onToggleHeader: () => void;
  isBottomConsoleOpen: boolean;
  onToggleBottomConsole: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

function DockButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[#A1A1AA] transition-all",
        active
          ? "border-[#C49B66]/40 bg-[#1D1D20] text-[#C49B66]"
          : "border-[#242427] bg-[#121214] hover:bg-[#1D1D20] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export function VscodeLayoutControls({
  isSidebarCollapsed,
  onToggleSidebar,
  isHeaderCollapsed,
  onToggleHeader,
  isBottomConsoleOpen,
  onToggleBottomConsole,
  isRightPanelOpen,
  onToggleRightPanel,
}: VscodeLayoutControlsProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[#242427] bg-[#121214]/95 p-1 shadow-2xl backdrop-blur-xl">
      <DockButton
        active={!isSidebarCollapsed}
        label={isSidebarCollapsed ? "Afficher sidebar" : "Replier sidebar"}
        onClick={onToggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={!isHeaderCollapsed}
        label={isHeaderCollapsed ? "Afficher header" : "Masquer header"}
        onClick={onToggleHeader}
      >
        <Rows3 className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={isBottomConsoleOpen}
        label={isBottomConsoleOpen ? "Fermer console" : "Ouvrir console"}
        onClick={onToggleBottomConsole}
      >
        <PanelBottom className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={isRightPanelOpen}
        label={isRightPanelOpen ? "Replier panel droit" : "Ouvrir panel droit"}
        onClick={onToggleRightPanel}
      >
        <PanelRight className="h-4 w-4" />
      </DockButton>
    </div>
  );
}
