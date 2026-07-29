"use client";

/**
 * Contact card — compact row in the contacts list.
 *
 * Shows a coloured-initials avatar, name, email, company/role, tags, and the
 * last-contact date. Clicking the card selects it so the detail panel opens.
 */
import { Building2, Mail, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { contactInitials, FREQUENCY_LABELS } from "@/stores/contact-store";
import type { Contact } from "@/types/contact";

interface ContactCardProps {
  contact: Contact;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Format an ISO timestamp as a relative "2d ago" / "just now" label. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ContactCard({ contact, active, onClick, className }: ContactCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="contact-card"
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors",
        active
          ? "border-[var(--color-brand-500)] bg-[var(--color-accent)]/40"
          : "border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]",
        className,
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: contact.avatarColor }}
        aria-hidden="true"
      >
        {contactInitials(contact.name, contact.email)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-[var(--color-fg)]">{contact.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-muted-fg)]">
            <Clock className="h-3 w-3" />
            {relativeTime(contact.lastContactAt)}
          </span>
        </div>

        <span className="flex items-center gap-1 truncate text-xs text-[var(--color-muted-fg)]">
          <Mail className="h-3 w-3" />
          {contact.email}
        </span>

        {contact.company && (
          <span className="flex items-center gap-1 truncate text-xs text-[var(--color-muted-fg)]">
            <Building2 className="h-3 w-3" />
            {contact.role ? `${contact.role} · ${contact.company}` : contact.company}
          </span>
        )}

        {contact.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {contact.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 4 && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                +{contact.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {contact.contactFrequency !== "never" && (
          <span className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted-fg)]">
            {FREQUENCY_LABELS[contact.contactFrequency]}
          </span>
        )}
      </div>
    </button>
  );
}
