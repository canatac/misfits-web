"use client";

/**
 * Account badge — a compact color dot + email address shown on email list
 * items when the unified inbox is active (Issue #154). Helps distinguish which
 * account a given email belongs to in the merged view.
 */
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/stores/account-store";

interface AccountBadgeProps {
  /** The account id the email belongs to (undefined = untagged/legacy). */
  accountId?: string;
  className?: string;
}

export function AccountBadge({ accountId, className }: AccountBadgeProps) {
  const account = useAccountStore((s) =>
    accountId ? s.accounts.find((a) => a.id === accountId) : undefined,
  );

  if (!account) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-fg)]",
        className,
      )}
      title={account.email}
      data-testid={`account-badge-${account.id}`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: account.color }}
        aria-hidden="true"
      />
      <span className="truncate max-w-[120px]">{account.email}</span>
    </span>
  );
}
