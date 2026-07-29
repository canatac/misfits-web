"use client";

/**
 * Email list item — individual email row with avatar, sender, subject,
 * preview, date, flags (unread, starred, attachment), bulk checkbox, and hover actions.
 */
import { memo, useMemo } from "react";
import { Star, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { LabelBadge } from "@/components/mail/label-badge";
import { AccountBadge } from "@/components/mail/account-badge";
import { SecurityIndicator } from "@/components/mail/security-indicator";
import { useLabelStore } from "@/stores/label-store";
import { useAccountStore } from "@/stores/account-store";
import type { Email } from "@/types/email";

/** Stable empty array — never return `?? []` from a Zustand selector. */
const EMPTY_LABEL_IDS: string[] = [];

interface EmailListItemProps {
  email: Email;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleStar: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function EmailListItemComponent({
  email,
  isActive,
  isSelected,
  onSelect,
  onToggleSelection,
  onToggleStar,
}: EmailListItemProps) {
  // Read the raw assignment ref (or stable EMPTY). `?? []` allocates every
  // selector call → React #185 (max update depth) once emails are listed.
  const assignedLabels = useLabelStore(
    (s) => s.assignments[email.id] ?? EMPTY_LABEL_IDS,
  );
  const allLabelIds = useMemo(
    () => Array.from(new Set([...email.labels, ...assignedLabels])),
    [email.labels, assignedLabels],
  );
  // Show the account badge in unified-inbox mode (Issue #154).
  const isUnifiedInbox = useAccountStore((s) => s.isUnifiedInbox);
  const accountsCount = useAccountStore((s) => s.accounts.length);
  const showAccountBadge = isUnifiedInbox && accountsCount > 1 && !!email.accountId;

  return (
    <div
      role="option"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect(email.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSelect(email.id);
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 border-b border-[var(--color-border)] px-3 py-3 transition-colors",
        isActive && "bg-[var(--color-accent)]",
        !isActive && email.isRead && "bg-[var(--color-bg)]",
        !isActive && !email.isRead && "bg-[var(--color-card)]",
        !isActive && "hover:bg-[var(--color-muted)]",
      )}
      data-testid={`email-item-${email.id}`}
    >
      {/* Bulk selection checkbox */}
      <div
        className="pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(email.id)}
          aria-label={`Select email: ${email.subject}`}
        />
      </div>

      {/* Unread indicator */}
      {!email.isRead && (
        <div
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]"
          aria-label="Unread"
        />
      )}

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(email.from.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !email.isRead ? "font-semibold text-[var(--color-fg)]" : "text-[var(--color-fg)]",
            )}
          >
            {email.from.name}
          </span>
          <span className="shrink-0 text-xs text-[var(--color-muted-fg)]">
            {formatDate(email.date)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !email.isRead ? "font-medium text-[var(--color-fg)]" : "text-[var(--color-muted-fg)]",
            )}
          >
            {email.subject}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <SecurityIndicator threatLevel="safe" />
            {email.hasAttachments && (
              <Paperclip className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" aria-label="Has attachments" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(email.id);
              }}
              className="rounded p-0.5 transition-colors hover:bg-[var(--color-muted)]"
              aria-label={email.isStarred ? "Unstar email" : "Star email"}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  email.isStarred
                    ? "fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                    : "text-[var(--color-muted-fg)]",
                )}
              />
            </button>
          </div>
        </div>

        <p className="truncate text-xs text-[var(--color-muted-fg)]">
          {email.preview}
        </p>

        {/* Labels */}
        {(allLabelIds.length > 0 || showAccountBadge) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {showAccountBadge && <AccountBadge accountId={email.accountId} />}
            {allLabelIds.slice(0, 3).map((labelId) => (
              <LabelBadge key={labelId} label={labelId} />
            ))}
            {allLabelIds.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-fg)]">
                +{allLabelIds.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const EmailListItem = memo(EmailListItemComponent);
