"use client";

import { Layers, Mail as MailIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export interface MobileTopBarProps {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  isUnifiedInbox: boolean;
  canToggleUnified: boolean;
  toggleUnifiedInbox: () => void;
}

export function MobileTopBar({
  mobileSidebarOpen,
  setMobileSidebarOpen,
  isUnifiedInbox,
  canToggleUnified,
  toggleUnifiedInbox,
}: MobileTopBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#242427] bg-[#111113]/95 px-3 py-2.5 text-[#E4E4E7] backdrop-blur-xl lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        aria-label="Ouvrir/fermer le menu"
        title={mobileSidebarOpen ? "Replier le menu" : "Afficher le menu"}
      >
        {mobileSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>
      <div className="flex items-center gap-2">
        <MailIcon className="h-5 w-5 text-[#C49B66]" />
        <span className="font-semibold">misfits.ai Mail</span>
      </div>
      <label
        className="flex items-center gap-1.5 text-xs"
        title="Toggle unified inbox"
      >
        <Layers className="h-4 w-4 text-[var(--color-brand-500)]" />
        <Switch
          checked={isUnifiedInbox}
          disabled={!canToggleUnified}
          onCheckedChange={toggleUnifiedInbox}
          aria-label="Toggle unified inbox"
        />
      </label>
    </div>
  );
}
