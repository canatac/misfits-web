"use client";
import { useState } from "react";
import { Sparkles, Reply, Archive, Clock, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmailSummary } from "@/hooks/use-ai-triage";
import type { Email } from "@/types/email";

export function AISummaryCard({ email }: { email: Email }) {
  const { data: summary, isLoading, refetch } = useEmailSummary(email);
  const [action, setAction] = useState<string | null>(null);

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4 dark:border-[var(--color-brand-800)] dark:bg-[var(--color-brand-900)]/30">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
        <span className="text-sm font-medium text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">AI Summary</span>
        <button onClick={() => refetch()} className="ml-auto" aria-label="Regenerate">
          <RotateCw className="h-3.5 w-3.5 text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]" />
        </button>
      </div>
      {isLoading ? (
        <Skeleton className="h-4 w-full" />
      ) : (
        <p className="text-sm text-[var(--color-fg)]">{summary || email.preview}</p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setAction("reply")}><Reply className="mr-1 h-3.5 w-3.5" />Reply</Button>
        <Button size="sm" variant="ghost" onClick={() => setAction("archive")}><Archive className="mr-1 h-3.5 w-3.5" />Archive</Button>
        <Button size="sm" variant="ghost" onClick={() => setAction("follow")}><Clock className="mr-1 h-3.5 w-3.5" />Follow up</Button>
      </div>
    </div>
  );
}
