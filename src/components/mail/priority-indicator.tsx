"use client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

function scoreColor(score: number): string {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 30) return "bg-yellow-500";
  return "bg-green-500";
}

export function PriorityIndicator({ priority, size = "sm" }: { priority: number; size?: "sm" | "full" }) {
  if (size === "sm") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-1.5 w-8 overflow-hidden rounded-full bg-[var(--color-muted)]">
              <div className={cn("h-full rounded-full", scoreColor(priority))} style={{ width: `${priority}%` }} />
            </div>
          </TooltipTrigger>
          <TooltipContent>Priority: {priority}/100</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-20 overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div className={cn("h-full rounded-full transition-all", scoreColor(priority))} style={{ width: `${priority}%` }} />
      </div>
      <span className="text-xs font-medium text-[var(--color-muted-fg)]">{priority}</span>
    </div>
  );
}
