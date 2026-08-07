"use client";

import { PanelBottom, PanelLeft, PanelRight, PanelTop } from "lucide-react";
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
        "group relative flex items-center justify-center rounded-lg p-1.5 transition-all",
        active
          ? "bg-[#1D1D20]/80 text-white"
          : "text-[#71717A] hover:bg-[#1D1D20]/80 hover:text-white",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute -bottom-0.5 left-1/2 h-0.5 w-2.5 -translate-x-1/2 rounded-full transition-all",
          active ? "bg-[#C49B66]" : "bg-transparent",
        )}
      />
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
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#242427] bg-[#121214]/90 p-1 shadow-xl backdrop-blur-xl">
      <DockButton
        active={!isSidebarCollapsed}
        label={isSidebarCollapsed ? "Afficher la barre latérale gauche (Menu)" : "Masquer la barre latérale gauche (Menu)"}
        onClick={onToggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={!isHeaderCollapsed}
        label={isHeaderCollapsed ? "Afficher la barre supérieure (Navigation)" : "Masquer la barre supérieure (Navigation)"}
        onClick={onToggleHeader}
      >
        <PanelTop className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={isBottomConsoleOpen}
        label={isBottomConsoleOpen ? "Masquer la console d'activité (Terminal)" : "Afficher la console d'activité (Terminal)"}
        onClick={onToggleBottomConsole}
      >
        <PanelBottom className="h-4 w-4" />
      </DockButton>

      <DockButton
        active={isRightPanelOpen}
        label={isRightPanelOpen ? "Masquer le panneau droit (Assistant Workspace)" : "Afficher le panneau droit (Assistant Workspace)"}
        onClick={onToggleRightPanel}
      >
        <PanelRight className="h-4 w-4" />
      </DockButton>
    </div>
  );
}
