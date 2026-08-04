"use client";

/**
 * Contacts page — the full intelligent address book UI (Issue #152).
 *
 * Three regions: a group sidebar, a searchable contact list, and a detail
 * panel. Includes import/export buttons (vCard + CSV) and an "add contact"
 * action. Enriches contact history from the email store on mount.
 */
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Upload,
  Download,
  Users,
  GitMerge,
  ArrowLeft,
  ChevronDown,
  FileText,
  Contact as ContactIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useContacts, useContactGroups, useContactMutations, useContactGroupMutations, useDuplicateContacts } from "@/hooks/use-contacts";
import { useSearchContacts } from "@/hooks/use-contacts";
import { useContactStore } from "@/stores/contact-store";
import { useEmailStore } from "@/stores/email-store";
import { toast } from "sonner";
import type { ContactInput } from "@/types/contact";

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
    const content = format === "vcard" ? store.exportContactsVCard() : store.exportContactsCSV();
    const blob = new Blob([content], {
      type: format === "vcard" ? "text/vcard" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts.${format === "vcard" ? "vcf" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${contacts.length} contacts as ${format.toUpperCase()}`);
  };

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[var(--color-bg)]"
      data-testid="contacts-page"
    >
      {/* Group sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] md:flex">
        <div className="flex items-center gap-2 p-3">
          <Link href="/mail" className="rounded-md p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]" aria-label="Back to mail">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ContactIcon className="h-4 w-4" />
            Contacts
          </span>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-3">
            <button
              onClick={() => {
                setActiveGroupId(null);
                setQuery("");
              }}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
                activeGroupId === null
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium"
                  : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
              )}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All contacts
              </span>
              <Badge variant="secondary">{contacts.length}</Badge>
            </button>

            <button
              onClick={() => setActiveGroupId("__ungrouped__")}
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
                activeGroupId === "__ungrouped__"
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium"
                  : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
              )}
            >
              <span>Ungrouped</span>
              <Badge variant="secondary">{ungroupedCount}</Badge>
            </button>

            <div className="mt-3 mb-1 flex items-center justify-between px-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
                Groups
              </span>
              <button
                onClick={() => setAddGroupOpen(true)}
                className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
                aria-label="Add group"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {groups.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--color-muted-fg)]">
                No groups yet.
              </p>
            )}
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={cn(
                  "flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm",
                  activeGroupId === g.id
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-medium"
                    : "text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  {g.name}
                </span>
                <Badge variant="secondary">{groupCounts.get(g.id) ?? 0}</Badge>
              </button>
            ))}

            {duplicates.length > 0 && (
              <>
                <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
                  Cleanup
                </div>
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-500)]/10 px-3 py-2 text-xs text-[var(--color-warning-500)]">
                  <GitMerge className="h-3.5 w-3.5" />
                  {duplicates.length} duplicate{duplicates.length === 1 ? "" : "s"} to review
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Contact list */}
      <section className="flex w-full flex-col md:w-[340px] md:shrink-0 md:border-r md:border-[var(--color-border)]">
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
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
            <Button size="sm" className="flex-1 gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setImporterOpen(true)}>
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
                <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("vcard")} className="gap-2">
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
          <ContactDetail contact={selected} onClose={() => setSelectedId(null)} />
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

/* ------------------------------------------------------------------ */
/* Add contact modal                                                 */
/* ------------------------------------------------------------------ */

function AddContactModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (input: ContactInput) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setCompany("");
    setRole("");
    setPhone("");
  };

  const valid = email.trim() && name.trim();

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent data-testid="add-contact-modal">
        <ModalHeader>
          <ModalTitle>Add contact</ModalTitle>
          <ModalDescription>Create a new contact record.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <Field label="Name *">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Email *">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company">
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
              </Field>
              <Field label="Role">
                <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Engineer" />
              </Field>
            </div>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
            </Field>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onAdd({
                name: name.trim(),
                email: email.trim(),
                company: company.trim() || undefined,
                role: role.trim() || undefined,
                phone: phone.trim() || undefined,
              });
              reset();
              onOpenChange(false);
            }}
          >
            Add contact
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AddGroupModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Add group</ModalTitle>
          <ModalDescription>Group contacts for easy filtering.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <Field label="Group name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Investors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onAdd(name.trim());
                  setName("");
                  onOpenChange(false);
                }
              }}
            />
          </Field>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onAdd(name.trim());
              setName("");
              onOpenChange(false);
            }}
          >
            Add group
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--color-muted-fg)]">{label}</span>
      {children}
    </label>
  );
}
