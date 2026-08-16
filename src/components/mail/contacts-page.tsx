"use client";

/**
 * Contacts page — the full intelligent address book UI (Issue #152).
 */
import { useEffect, useMemo, useState } from "react";
import { Contact as ContactIcon } from "lucide-react";
import { ContactDetail } from "@/components/mail/contact-detail";
import { ContactImporter } from "@/components/mail/contact-importer";
import {
  useContactGroupMutations,
  useContactGroups,
  useContactMutations,
  useContacts,
  useDuplicateContacts,
} from "@/hooks/use-contacts";
import { useSearchContacts } from "@/hooks/use-contacts";
import { useContactStore } from "@/stores/contact-store";
import { useEmailStore } from "@/stores/email-store";
import { toast } from "sonner";
import {
  AddContactModal,
  AddGroupModal,
} from "@/components/mail/contacts-page/modals";
import { ContactsSidebar } from "@/components/mail/contacts-page/contacts-sidebar";
import { ContactsListPane } from "@/components/mail/contacts-page/contacts-list-pane";

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

  useEffect(() => {
    if (allEmails.length > 0) enrichFromEmails(allEmails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    let list = results;
    if (activeGroupId) list = list.filter((c) => c.groupId === activeGroupId);
    return list;
  }, [results, activeGroupId]);

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

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
      <ContactsSidebar
        contacts={contacts}
        groups={groups}
        duplicatesCount={duplicates.length}
        groupCounts={groupCounts}
        ungroupedCount={ungroupedCount}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
        setQuery={setQuery}
        setAddGroupOpen={setAddGroupOpen}
      />

      <ContactsListPane
        query={query}
        setQuery={setQuery}
        visible={visible}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        setAddOpen={setAddOpen}
        setImporterOpen={setImporterOpen}
        handleExport={handleExport}
      />

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

      <AddContactModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={async (input) => {
          const c = await addContact.mutateAsync(input);
          setSelectedId(c.id);
        }}
      />

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
