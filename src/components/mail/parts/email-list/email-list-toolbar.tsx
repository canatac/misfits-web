"use client";

import { RefObject } from "react";
import {
  Search,
  ArrowDownUp,
  Archive,
  Trash2,
  MailOpen,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { FilterType, SortBy } from "@/types/email";

type BulkAction = "archive" | "delete" | "markRead" | "markUnread" | "star" | "unstar";

export const FILTER_TABS: { value: FilterType; label: string }[] = [
  { value: "all", label: "Focus" },
  { value: "unread", label: "Non lus" },
  { value: "starred", label: "VIP" },
  { value: "attachments", label: "Pièces jointes" },
];

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date", label: "Date (newest)" },
  { value: "sender", label: "Sender (A–Z)" },
  { value: "subject", label: "Subject (A–Z)" },
  { value: "size", label: "Size (largest)" },
  { value: "unreadFirst", label: "Unread first" },
];

interface EmailListToolbarProps {
  searchRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  filterType: FilterType;
  setFilterType: (v: FilterType) => void;
  loading: boolean;
  onManualRefresh: () => void;
  newEmailsCount: number;
  acknowledgeNewEmails: () => void;
  hasSelection: boolean;
  selectedCount: number;
  bulkAction: (a: BulkAction) => void;
  clearSelection: () => void;
  showSelectAll: boolean;
  allSelected: boolean;
  onSelectAll: () => void;
  visibleCount: number;
}

export function EmailListToolbar({
  searchRef,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filterType,
  setFilterType,
  loading,
  onManualRefresh,
  newEmailsCount,
  acknowledgeNewEmails,
  hasSelection,
  selectedCount,
  bulkAction,
  clearSelection,
  showSelectAll,
  allSelected,
  onSelectAll,
  visibleCount,
}: EmailListToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#242427] bg-[#121214] p-3">
      <div className="flex items-center justify-between rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-xs">
        <span className="font-semibold text-[#E0E0E0]">Focus Inbox</span>
        <span className="font-mono text-[#C49B66]">Signal trié IA</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-[#242427] bg-[#0A0A0B] pl-9 text-[#E0E0E0] placeholder:text-[#71717A]"
            aria-label="Search emails"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger
            className="w-[160px] border-[#242427] bg-[#0A0A0B] text-[#D4D4D8]"
            aria-label="Sort by"
          >
            <ArrowDownUp className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={onManualRefresh}
          disabled={loading}
          aria-label="Rafraîchir la boîte de réception"
          title="Rafraîchir"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {newEmailsCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#3A2F1F] bg-[#18130D] px-3 py-2 text-xs">
          <span className="text-[#F5D7A9]">
            {newEmailsCount} nouveau{newEmailsCount > 1 ? "x" : ""} mail
            {newEmailsCount > 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[#F5D7A9] hover:text-[#FDE7C6]"
            onClick={acknowledgeNewEmails}
          >
            Voir
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Tabs
          value={filterType}
          onValueChange={(v) => setFilterType(v as FilterType)}
        >
          <TabsList>
            {FILTER_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {hasSelection && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--color-muted-fg)]">
              {selectedCount} selected
            </span>
            <Button size="sm" variant="ghost" onClick={() => bulkAction("archive")}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => bulkAction("delete")}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => bulkAction("markRead")}>
              <MailOpen className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {showSelectAll && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            aria-label="Select all emails"
          />
          <span className="text-xs text-[var(--color-muted-fg)]">
            {visibleCount} {visibleCount === 1 ? "email" : "emails"}
          </span>
        </div>
      )}
    </div>
  );
}
