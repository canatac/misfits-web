"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/hooks/use-command-palette";
import { useComposerStore } from "@/stores/composer-store";
import { useCommandPaletteEmailSearch } from "@/hooks/use-command-palette-email-search";
import { useEmailStore } from "@/stores/email-store";
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

interface CommandItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  keywords?: string[];
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useCommandPaletteStore((s) => s.open);
  const closePalette = useCommandPaletteStore((s) => s.closePalette);
  const openComposer = useComposerStore((s) => s.openComposer);
  const selectEmail = useEmailStore((s) => s.selectEmail);

  const [query, setQuery] = useState("");
  const { results: emailResults } = useCommandPaletteEmailSearch(query);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      closePalette();
    },
    [router, closePalette]
  );

  // Reset query when palette opens/closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelectEmail = useCallback(
    (emailId: string) => {
      selectEmail(emailId);
      closePalette();
    },
    [selectEmail, closePalette]
  );

  const commands: CommandItemData[] = useMemo(
    () => [
      {
        id: "goto-inbox",
        label: "Aller à Inbox",
        icon: <Inbox className="h-4 w-4" />,
        group: "Aller à",
        keywords: ["inbox", "boîte", "réception"],
        action: () => navigate("/mail"),
      },
      {
        id: "goto-compose",
        label: "Composer un email",
        icon: <Plus className="h-4 w-4" />,
        shortcut: "⌘K → C",
        group: "Aller à",
        keywords: ["composer", "nouveau", "email", "message"],
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
        keywords: ["recherche", "chercher", "find"],
        action: () => navigate("/search"),
      },
      {
        id: "goto-settings",
        label: "Paramètres",
        icon: <Settings className="h-4 w-4" />,
        group: "Aller à",
        keywords: ["paramètres", "configuration", "settings"],
        action: () => navigate("/settings"),
      },
      {
        id: "goto-calendar",
        label: "Calendrier",
        icon: <Calendar className="h-4 w-4" />,
        group: "Aller à",
        keywords: ["calendrier", "calendar"],
        action: () => navigate("/calendar"),
      },
      {
        id: "action-new-email",
        label: "Nouvel email",
        icon: <Plus className="h-4 w-4" />,
        shortcut: "C",
        group: "Actions",
        keywords: ["nouveau", "email", "composer"],
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
        keywords: ["archiver", "archive"],
        action: () => closePalette(),
      },
      {
        id: "action-delete",
        label: "Supprimer",
        icon: <Trash2 className="h-4 w-4" />,
        group: "Actions",
        keywords: ["supprimer", "delete", "effacer"],
        action: () => closePalette(),
      },
      {
        id: "action-star",
        label: "Favoris",
        icon: <Star className="h-4 w-4" />,
        group: "Actions",
        keywords: ["favoris", "star", "étoile"],
        action: () => closePalette(),
      },
      {
        id: "action-mark-unread",
        label: "Marquer comme non lu",
        icon: <Eye className="h-4 w-4" />,
        group: "Actions",
        keywords: ["marquer", "non lu", "unread"],
        action: () => closePalette(),
      },
      {
        id: "settings-theme",
        label: "Changer le thème",
        icon: <Moon className="h-4 w-4" />,
        group: "Paramètres",
        keywords: ["thème", "dark", "light", "mode"],
        action: () => navigate("/settings"),
      },
      {
        id: "settings-notifications",
        label: "Notifications",
        icon: <Bell className="h-4 w-4" />,
        group: "Paramètres",
        keywords: ["notifications", "alertes"],
        action: () => navigate("/settings"),
      },
      {
        id: "settings-shortcuts",
        label: "Raccourcis clavier",
        icon: <Keyboard className="h-4 w-4" />,
        group: "Paramètres",
        keywords: ["raccourcis", "clavier", "shortcuts"],
        action: () => navigate("/settings"),
      },
    ],
    [navigate, openComposer, closePalette]
  );

  const groups = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItemData[]>
  );

  const hasQuery = query.trim().length > 0;
  const showEmailResults = hasQuery && emailResults.length > 0;
  const showNoResults = hasQuery && emailResults.length === 0 && query.trim().length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={(o: boolean) => !o && closePalette()}>
      <CommandInput
        placeholder="Taper une commande ou rechercher un email..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {showNoResults
            ? "Aucun email trouvé pour cette recherche."
            : "Aucune commande trouvée."}
        </CommandEmpty>

        {/* Email Search Results */}
        {showEmailResults && (
          <CommandGroup heading="Emails">
            {emailResults.map((result) => (
              <CommandItem
                key={`email-${result.email.id}`}
                onSelect={() => handleSelectEmail(result.email.id)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4 shrink-0 text-[var(--color-muted-fg)]" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {result.email.subject || "(Sans objet)"}
                  </span>
                  <span className="truncate text-xs text-[var(--color-muted-fg)]">
                    {result.email.from.name} — {result.email.preview}
                  </span>
                </div>
                {!result.email.isRead && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation Commands */}
        {Object.entries(groups).map(([groupName, items], groupIndex) => (
          <div key={groupName}>
            {showEmailResults && groupIndex === 0 && <CommandSeparator />}
            <CommandGroup heading={groupName}>
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
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
