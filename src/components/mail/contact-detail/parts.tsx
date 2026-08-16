"use client";

/**
 * Presentational bits used by <ContactDetail />.
 * Extracted to keep the panel component below the 300 LOC guardrail
 * without introducing any parent import.
 */
import { GitMerge, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Email } from "@/types/email";
import { relativeTime } from "@/components/mail/contact-card";

export function InfoRow({
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
      <span className="w-24 shrink-0 text-[var(--color-muted-fg)]">
        {label}
      </span>
      <span className="flex-1 truncate text-[var(--color-fg)]">
        {value || "—"}
      </span>
    </div>
  );
}

export function DuplicateBanner({
  reason,
  onMerge,
  loading,
}: {
  reason: string;
  onMerge: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/40 bg-[var(--color-warning-500)]/10 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-warning-500)]">
        <GitMerge className="h-4 w-4" />
        Possible duplicate
      </div>
      <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
        This contact may be a duplicate (matched by {reason}). Merge to keep a
        single combined record.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 gap-1.5"
        onClick={onMerge}
        loading={loading}
      >
        <GitMerge className="h-3.5 w-3.5" />
        Merge into primary
      </Button>
    </div>
  );
}

export function ContactTimeline({ timeline }: { timeline: Email[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
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
  );
}
