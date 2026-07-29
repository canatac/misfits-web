"use client";
import { useTriageStore } from "@/stores/ai-triage-store";
import { useTriageStats } from "@/hooks/use-ai-triage";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/mail/category-badge";
import { PriorityIndicator } from "@/components/mail/priority-indicator";
import { Zap, Inbox } from "lucide-react";

export function TriagePanel({ emails, onProcessAll }: { emails: any[]; onProcessAll?: () => void }) {
  const stats = useTriageStats();
  const results = useTriageStore((s) => s.triageResults);
  const isProcessing = useTriageStore((s) => s.isProcessing);

  const urgent = Object.values(results).filter((r) => r.needsUrgentReply).sort((a, b) => b.priority - a.priority);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Triage</h3>
        <Button size="sm" variant="ghost" onClick={onProcessAll} disabled={isProcessing}>
          <Zap className="mr-1 h-3.5 w-3.5" />
          {isProcessing ? "Processing..." : "Process all"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(stats.stats).map(([cat, count]) => (
          <div key={cat} className="flex items-center justify-between rounded-md bg-[var(--color-muted)] px-2 py-1.5">
            <CategoryBadge category={cat as any} />
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>

      {urgent.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-[var(--color-muted-fg)]">Needs attention</p>
          {urgent.slice(0, 5).map((r) => {
            const email = emails.find((e) => e.id === r.emailId);
            if (!email) return null;
            return (
              <div key={r.emailId} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-muted)]">
                <PriorityIndicator priority={r.priority} />
                <span className="truncate text-xs">{email.subject}</span>
              </div>
            );
          })}
        </div>
      )}

      {stats.total === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--color-muted-fg)]">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">No triage yet. Click &quot;Process all&quot;.</p>
        </div>
      )}
    </div>
  );
}
