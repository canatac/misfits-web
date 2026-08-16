"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function EmailListSkeleton() {
  return (
    <div className="flex flex-col gap-0" data-testid="email-list-skeleton">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 border-b border-[var(--color-border)] p-3"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmailListEmpty() {
  return (
    <EmptyState
      icon={InboxIcon}
      title="No emails here"
      description="This folder is empty, or no emails match your current filters."
      size="lg"
    />
  );
}
