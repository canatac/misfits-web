"use client";

/**
 * Contacts page — the full intelligent address book UI (Issue #152).
 *
 * Three regions: a group sidebar, a searchable contact list, and a detail
 * panel. Includes import/export buttons (vCard + CSV) and an "add contact"
 * action. Enriches contact history from the email store on mount.
 */
import { useMemo, useState, useEffect } from "react";
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { ContactCard } from "@/components/mail/contact-card";
import { ContactDetail } from "@/components/mail/contact-detail";
import { ContactImporter } from "@/components/mail/contact-importer";
import {
  useContacts,
  useContactGroups,
  useContactMutations,
  useContactGroupMutations,
  useDuplicateContacts,
} from "@/hooks/use-contacts";
import { useSearchContacts } from "@/hooks/use-contacts";
import { useContactStore } from "@/stores/contact-store";
import { useEmailStore } from "@/stores/email-store";
import { toast } from "sonner";
import type { ContactInput } from "@/types/contact";
import { AddContactModal, AddGroupModal } from "@/components/mail/contacts-page/modals";
import { ContactGroupSidebar } from "@/components/mail/contacts-page/group-sidebar";

export function ContactsPage() {
  const { data: contacts = [] } = useContacts();
  const { data: groups = [] } = useContactGroups();
  const duplicatesQuery = useDuplicateContacts();
  const duplicates = duplicatesQuery.data ?? [];
  const { addContact } = useContactMutations();
  const { addGroup } = useContactGroupMutations();

  const { query, setQuery, results } = useSearchContacts();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [importerOpen, setImporterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);

  const enrichFromEmails = useContactStore((s) => s.enrichFromEmails);
  const allEmails = useEmailStore((s) => s.emails);

  // Enrich contact history once on mount when the page has emails loaded.
  useEffect(() => {
    if (allEmails.length > 0) enrichFromEmails(allEmails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter by group then apply search results.
  const visible = useMemo(() => {
    let list = results;
    if (activeGroupId) list = list.filter((c) => c.groupId === activeGroupId);
    return list;
  }, [results, activeGroupId]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  // Counts per group for the sidebar.
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of contacts) {
      if (c.groupId) counts.set(c.groupId, (counts.get(c.groupId) ?? 0) + 1);
    }
    return counts;
  }, [contacts]);

  const ungroupedCount = contacts.filter((c) => !c.groupId).length;

  const handleExport = (format: "vcard" | "csv") => {
    const store = useContactStore.getState();
    const content =
      format === "vcard"
        ? store.exportContactsVCard()
        : store.exportContactsCSV();
    const blob = new Blob([content], {
      type: format === "vcard" ? "text/vcard" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts.${format === "vcard" ? "vcf" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Exported ${contacts.length} contacts as ${format.toUpperCase()}`
    );
  };

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[var(--color-bg)]"
      data-testid="contacts-page"
    >
      {/* Group sidebar */}
      <ContactGroupSidebar
        contacts={contacts}
        groups={groups}
        groupCounts={groupCounts}
        ungroupedCount={ungroupedCount}
        duplicatesCount={duplicates.length}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
        setQuery={setQuery}
        onAddGroup={() => setAddGroupOpen(true)}
      />

      {/* Contact list */}
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
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setImporterOpen(true)}
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
                  onClick={() => handleExport("csv")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExport("vcard")}
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

      {/* Detail panel */}
      <section className="hidden flex-1 md:block">
        {selected ? (
          <ContactDetail
            contact={selected}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-muted-fg)]">
            <ContactIcon className="h-10 w-10" />
            <p className="text-sm">Select a contact to view details.</p>
          </div>
        )}
      </section>

      {/* Add contact modal */}
      <AddContactModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={async (input) => {
          const c = await addContact.mutateAsync(input);
          setSelectedId(c.id);
        }}
      />

      {/* Add group modal */}
      <AddGroupModal
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        onAdd={(name) => {
          addGroup.mutate({ name });
        }}
      />

      <ContactImporter open={importerOpen} onOpenChange={setImporterOpen} />
    </div>
  );
}

