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
import { useEmailStore } from "@/stores/email-store";
import { searchEmails } from "@/lib/search-engine";
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
  Mail,
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
  const emails = useEmailStore((s) => s.emails);
  const [query, setQuery] = useState("");

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

  const emailResults = query.trim().length >= 2
    ? searchEmails(query, emails, "relevance").results.slice(0, 8)
    : [];

  return (
    <CommandDialog open={open} onOpenChange={(o: boolean) => !o && closePalette()}>
      <CommandInput
        placeholder="Taper une commande ou rechercher un email..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Aucun email trouvé pour cette recherche.</CommandEmpty>
        {emailResults.length > 0 && (
          <CommandGroup heading="Emails">
            {emailResults.map((result) => (
              <CommandItem
                key={result.email.id}
                onSelect={() => {
                  router.push(`/mail/${result.email.id}`);
                  closePalette();
                }}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{result.email.subject}</span>
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    {result.email.from.name} — {result.email.preview}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
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
