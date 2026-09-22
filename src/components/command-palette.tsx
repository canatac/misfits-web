"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/hooks/use-command-palette";
import { useComposerStore } from "@/stores/composer-store";
import {
  Inbox,
  Search,
  Settings,
  Calendar,
  Plus,
  Archive,
  Trash2,
  Star,
  Eye,
  Moon,
  Bell,
  Keyboard,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useCommandPaletteStore((s) => s.open);
  const closePalette = useCommandPaletteStore((s) => s.closePalette);
  const openComposer = useComposerStore((s) => s.openComposer);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      closePalette();
    },
    [router, closePalette],
  );

  const commands: CommandItem[] = [
    {
      id: "goto-inbox",
      label: "Aller à Inbox",
      icon: <Inbox className="h-4 w-4" />,
      group: "Aller à",
      action: () => navigate("/mail"),
    },
    {
      id: "goto-compose",
      label: "Composer un email",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "⌘K → C",
      group: "Aller à",
      action: () => {
        openComposer(null);
        closePalette();
      },
    },
    {
      id: "goto-search",
      label: "Recherche",
      icon: <Search className="h-4 w-4" />,
      group: "Aller à",
      action: () => navigate("/search"),
    },
    {
      id: "goto-settings",
      label: "Paramètres",
      icon: <Settings className="h-4 w-4" />,
      group: "Aller à",
      action: () => navigate("/settings"),
    },
    {
      id: "goto-calendar",
      label: "Calendrier",
      icon: <Calendar className="h-4 w-4" />,
      group: "Aller à",
      action: () => navigate("/calendar"),
    },
    {
      id: "action-new-email",
      label: "Nouvel email",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "C",
      group: "Actions",
      action: () => {
        openComposer(null);
        closePalette();
      },
    },
    {
      id: "action-archive",
      label: "Archiver",
      icon: <Archive className="h-4 w-4" />,
      group: "Actions",
      action: () => closePalette(),
    },
    {
      id: "action-delete",
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4" />,
      group: "Actions",
      action: () => closePalette(),
    },
    {
      id: "action-star",
      label: "Favoris",
      icon: <Star className="h-4 w-4" />,
      group: "Actions",
      action: () => closePalette(),
    },
    {
      id: "action-mark-unread",
      label: "Marquer comme non lu",
      icon: <Eye className="h-4 w-4" />,
      group: "Actions",
      action: () => closePalette(),
    },
    {
      id: "settings-theme",
      label: "Changer le thème",
      icon: <Moon className="h-4 w-4" />,
      group: "Paramètres",
      action: () => navigate("/settings"),
    },
    {
      id: "settings-notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      group: "Paramètres",
      action: () => navigate("/settings"),
    },
    {
      id: "settings-shortcuts",
      label: "Raccourcis clavier",
      icon: <Keyboard className="h-4 w-4" />,
      group: "Paramètres",
      action: () => navigate("/settings"),
    },
  ];

  const groups = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  return (
    <CommandDialog open={open} onOpenChange={(o: boolean) => !o && closePalette()}>
      <CommandInput placeholder="Taper une commande..." />
      <CommandList>
        <CommandEmpty>Aucune commande trouvée.</CommandEmpty>
        {Object.entries(groups).map(([groupName, items]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {items.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={cmd.action}
                className="flex items-center gap-2"
              >
                {cmd.icon}
                <span>{cmd.label}</span>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
