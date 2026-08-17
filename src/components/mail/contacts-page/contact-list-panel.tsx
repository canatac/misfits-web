"use client";

import {
  Search,
  Plus,
  Upload,
  Download,
  ChevronDown,
  FileText,
  Contact as ContactIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ContactCard } from "@/components/mail/contact-card";
import type { Contact } from "@/types/contact";

interface ContactListPanelProps {
  query: string;
  setQuery: (q: string) => void;
  visible: Contact[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: (format: "vcard" | "csv") => void;
}

export function ContactListPanel({
  query,
  setQuery,
  visible,
  selectedId,
  setSelectedId,
  onAdd,
  onImport,
  onExport,
}: ContactListPanelProps) {
  return (
    <section className="flex w-full flex-col md:w-[340px] md:shrink-0 md:border-r md:border-[var(--color-border)]">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="pl-9"
              aria-label="Search contacts"
              data-testid="contact-search"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="flex-1 gap-1.5" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={onImport}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onExport("csv")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExport("vcard")}
                className="gap-2"
              >
                <ContactIcon className="h-4 w-4" />
                Export as vCard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-3">
          {visible.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-muted-fg)]">
              No contacts found.
            </p>
          ) : (
            visible.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                active={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
