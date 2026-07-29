"use client";

/**
 * Account Selector — dropdown listing every connected account with a color
 * dot, email, and unread badge, plus a unified-inbox toggle and an "Add account"
 * button that opens the AddAccountModal (Issue #154).
 *
 * Replaces the static ACCOUNTS placeholder that previously lived in the sidebar.
 */
import * as React from "react";
import { ChevronDown, Mail, Plus, Check, Layers, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useAccountStore } from "@/stores/account-store";
import { useEmailStore } from "@/stores/email-store";
import { AddAccountModal } from "@/components/mail/add-account-modal";

function initialsOf(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

interface AccountSelectorProps {
  className?: string;
}

export function AccountSelector({ className }: AccountSelectorProps) {
  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const isUnifiedInbox = useAccountStore((s) => s.isUnifiedInbox);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);
  const toggleUnifiedInbox = useAccountStore((s) => s.toggleUnifiedInbox);
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount);

  // Unread counts per account (derived from the email store's current emails).
  const emails = useEmailStore((s) => s.emails);

  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;

  const [addOpen, setAddOpen] = React.useState(false);

  const unreadByAccount = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of emails) {
      if (e.isRead) continue;
      const aid = e.accountId;
      if (!aid) continue;
      counts.set(aid, (counts.get(aid) ?? 0) + 1);
    }
    return counts;
  }, [emails]);

  const totalUnread = emails.filter((e) => !e.isRead).length;
  const canToggleUnified = accounts.length > 1;

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-2" data-testid="account-selector-trigger">
            {isUnifiedInbox ? (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)]"
                aria-hidden="true"
              >
                <Layers className="h-4 w-4 text-[var(--color-brand-500)]" />
              </span>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback>{activeAccount?.avatar ?? initialsOf(activeAccount?.email ?? "?")}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col items-start gap-0">
              <span className="text-sm font-medium">
                {isUnifiedInbox ? "Unified Inbox" : activeAccount?.name ?? "No account"}
              </span>
              <span className="text-xs text-[var(--color-muted-fg)] truncate max-w-[160px]">
                {isUnifiedInbox
                  ? `${accounts.length} accounts`
                  : activeAccount?.email ?? "—"}
              </span>
            </div>
            <ChevronDown className="ml-auto h-4 w-4 text-[var(--color-muted-fg)]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72" data-testid="account-selector-menu">
          <DropdownMenuLabel>Accounts</DropdownMenuLabel>

          {/* Unified inbox toggle */}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-[var(--color-brand-500)]" />
              <span>Unified Inbox</span>
              {isUnifiedInbox && totalUnread > 0 && (
                <Badge variant="secondary">{totalUnread}</Badge>
              )}
            </div>
            <Switch
              checked={isUnifiedInbox}
              disabled={!canToggleUnified}
              onCheckedChange={() => toggleUnifiedInbox()}
              aria-label="Toggle unified inbox"
            />
          </div>
          {!canToggleUnified && (
            <p className="px-2 pb-1 text-xs text-[var(--color-muted-fg)]">
              Add another account to enable the unified inbox.
            </p>
          )}
          <DropdownMenuSeparator />

          {/* Account list */}
          {accounts.map((acc) => {
            const isActive = !isUnifiedInbox && acc.id === activeAccountId;
            const unread = unreadByAccount.get(acc.id) ?? 0;
            return (
              <DropdownMenuItem
                key={acc.id}
                onClick={() => setActiveAccount(acc.id)}
                className="gap-3"
                data-testid={`account-item-${acc.id}`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-[var(--color-border)]"
                  style={{ backgroundColor: acc.color }}
                  aria-hidden="true"
                />
                <div className="flex flex-1 flex-col">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {acc.name ?? acc.email.split("@")[0]}
                    {acc.isDefault && (
                      <Star className="h-3 w-3 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]" aria-label="Default account" />
                    )}
                  </span>
                  <span className="truncate text-xs text-[var(--color-muted-fg)]">
                    {acc.email}
                  </span>
                </div>
                {unread > 0 && (
                  <Badge variant={isActive ? "default" : "secondary"}>{unread}</Badge>
                )}
                {isActive && <Check className="h-4 w-4 text-[var(--color-brand-500)]" />}
              </DropdownMenuItem>
            );
          })}

          {accounts.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-[var(--color-muted-fg)]">
              No accounts connected.
            </p>
          )}

          <DropdownMenuSeparator />

          {/* Make default action for the active account */}
          {activeAccount && !activeAccount.isDefault && (
            <DropdownMenuItem
              onClick={() => setDefaultAccount(activeAccount.id)}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              Make default
            </DropdownMenuItem>
          )}

          {/* Add account */}
          <DropdownMenuItem
            onClick={() => setAddOpen(true)}
            className="gap-2 text-[var(--color-brand-500)]"
            data-testid="add-account-menu-item"
          >
            <Plus className="h-4 w-4" />
            Add account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddAccountModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
