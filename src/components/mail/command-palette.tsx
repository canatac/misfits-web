"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Modal as Dialog,
  ModalContent as DialogContent,
} from "@/components/ui/modal";
import { PenLine, Search, Inbox, Archive, Trash2, Star, Paperclip } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompose: () => void;
  onSearch: () => void;
  onNavigate: (folder: string) => void;
  onArchive: () => void;
  onDelete: () => void;
}

const FOLDERS = [
  { id: "inbox", label: "Boîte de réception", icon: Inbox },
  { id: "starred", label: "Favoris", icon: Star },
  { id: "archive", label: "Archives", icon: Archive },
  { id: "trash", label: "Corbeille", icon: Trash2 },
  { id: "attachments", label: "Pièces jointes", icon: Paperclip },
];

export function CommandPalette({
  open,
  onOpenChange,
  onCompose,
  onSearch,
  onNavigate,
  onArchive,
  onDelete,
}: CommandPaletteProps) {
  const handleSelect = useCallback(
    (callback: () => void) => {
      callback();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[#71717A] [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput placeholder="Taper une commande ou rechercher..." />
          <CommandList>
            <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => handleSelect(onCompose)}
                keywords={["composer", "nouveau", "email"]}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Composer un message
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(onSearch)}
                keywords={["rechercher", "chercher", "find"]}
              >
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(onArchive)}
                keywords={["archiver", "archive"]}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archiver la sélection
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect(onDelete)}
                keywords={["supprimer", "delete", "effacer"]}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer la sélection
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Navigation">
              {FOLDERS.map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() => handleSelect(() => onNavigate(folder.id))}
                  keywords={[folder.label, folder.id]}
                >
                  <folder.icon className="mr-2 h-4 w-4" />
                  {folder.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
