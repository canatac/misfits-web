"use client";

/**
 * Contact detail panel — full info, inline notes + tags editors, a contact
 * timeline (recent emails exchanged with this contact), and a merge-duplicate
 * suggestion when a duplicate is detected.
 */
import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  Tag,
  X,
  Plus,
  GitMerge,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { contactInitials, FREQUENCY_LABELS } from "@/stores/contact-store";
import { useContactMutations, useDuplicateContacts } from "@/hooks/use-contacts";
import { useEmailStore } from "@/stores/email-store";
import type { Email } from "@/types/email";
import type { Contact as AddressBookContact } from "@/types/contact";
import { relativeTime } from "@/components/mail/contact-card";

interface ContactDetailProps {
  contact: AddressBookContact;
  onClose?: () => void;
}

/** Find recent emails involving the contact (from/to/cc), newest first. */
function useContactTimeline(email: string): Email[] {
  const emails = useEmailStore((s) => s.emails);
  const e = email.trim().toLowerCase();
  return useMemo(() => {
    return emails
      .filter(
        (m) =>
          m.from.address.toLowerCase() === e ||
          m.to.some((r) => r.address.toLowerCase() === e) ||
          (m.cc ?? []).some((r) => r.address.toLowerCase() === e),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [emails, e]);
}

export function ContactDetail({ contact, onClose }: ContactDetailProps) {
  const { updateContact, deleteContact, mergeContacts } = useContactMutations();
  const duplicatesQuery = useDuplicateContacts();
  const duplicates = duplicatesQuery.data ?? [];
  const timeline = useContactTimeline(contact.email);

  const [notes, setNotes] = useState(contact.notes ?? "");
  const [tagInput, setTagInput] = useState("");

  // Keep local notes in sync when switching contacts.
  useEffect(() => setNotes(contact.notes ?? ""), [contact.id, contact.notes]);

  const duplicateOf = duplicates.find((d) => d.duplicateId === contact.id);

  const saveNotes = () => {
    if (notes.trim() !== (contact.notes ?? "").trim()) {
      updateContact.mutate({ id: contact.id, input: { notes } });
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || contact.tags.includes(t)) {
      setTagInput("");
      return;
    }
    updateContact.mutate({ id: contact.id, input: { tags: [...contact.tags, t] } });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateContact.mutate({
      id: contact.id,
      input: { tags: contact.tags.filter((t) => t !== tag) },
    });
  };

  const handleMerge = () => {
    if (!duplicateOf) return;
    mergeContacts.mutate({ primaryId: duplicateOf.primaryId, duplicateId: contact.id });
    onClose?.();
  };

  return (
    <aside
      className="flex h-full w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-card)]"
      data-testid="contact-detail"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: contact.avatarColor }}
          aria-hidden="true"
        >
          {contactInitials(contact.name, contact.email)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-[var(--color-fg)]">
            {contact.name}
          </h2>
          <p className="truncate text-sm text-[var(--color-muted-fg)]">{contact.email}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 p-4">
          {/* Duplicate suggestion */}
          {duplicateOf && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-warning-500)]">
                <GitMerge className="h-4 w-4" />
                Possible duplicate
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
                This contact may be a duplicate (matched by {duplicateOf.reason}). Merge to keep a
                single combined record.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 gap-1.5"
                onClick={handleMerge}
                loading={mergeContacts.isPending}
              >
                <GitMerge className="h-3.5 w-3.5" />
                Merge into primary
              </Button>
            </div>
          )}

          {/* Info grid */}
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={contact.company} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Role" value={contact.role} />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Last contact"
              value={relativeTime(contact.lastContactAt)}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Frequency"
              value={FREQUENCY_LABELS[contact.contactFrequency]}
            />
          </dl>

          {/* Tags editor */}
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
              <Tag className="h-3 w-3" />
              Tags
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {contact.tags.length === 0 && (
                <span className="text-xs text-[var(--color-muted-fg)]">No tags yet.</span>
              )}
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-[var(--color-danger-500)]/15 hover:text-[var(--color-danger-500)]"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag…"
                className="h-8 text-xs"
                aria-label="Add tag"
              />
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={addTag} aria-label="Add tag">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Notes editor */}
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
              Notes
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes about this contact…"
              className="min-h-[100px] text-sm"
              aria-label="Contact notes"
            />
          </div>

          {/* Timeline */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
              <Mail className="h-3 w-3" />
              Recent emails
            </div>
            {timeline.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-fg)]">
                No recent emails with this contact.
              </p>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {timeline.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-[var(--color-fg)]">
                        {m.subject}
                      </span>
                      <span className="shrink-0 text-[10px] text-[var(--color-muted-fg)]">
                        {relativeTime(m.date)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted-fg)]">
                      {m.preview}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Danger zone */}
          <Separator />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10"
            onClick={() => {
              deleteContact.mutate(contact.id);
              onClose?.();
            }}
            loading={deleteContact.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete contact
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className={cn("flex items-center gap-2", !value && "opacity-50")}>
      <span className="text-[var(--color-muted-fg)]">{icon}</span>
      <span className="w-24 shrink-0 text-[var(--color-muted-fg)]">{label}</span>
      <span className="flex-1 truncate text-[var(--color-fg)]">{value || "—"}</span>
    </div>
  );
}
