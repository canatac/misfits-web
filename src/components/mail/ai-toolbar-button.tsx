"use client";

/**
 * Toolbar button that toggles the AI composer panel. Shows a sparkle icon and
 * pulses while a generation is in flight.
 */
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIToolbarButtonProps {
  /** Whether the AI panel is currently open. */
  active?: boolean;
  /** Show the loading animation (a generation is in flight). */
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  /** Tooltip / aria label override. */
  label?: string;
}

export function AIToolbarButton({
  active,
  loading,
  onClick,
  className,
  label = "Assistant IA",
}: AIToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={loading && !active}
          className={cn(
            "h-8 w-8",
            active && "bg-[var(--color-accent)] text-[var(--color-accent-fg)]",
            className
          )}
          aria-label={label}
          aria-pressed={active}
          data-testid="ai-toolbar-button"
        >
          <Sparkles
            className={cn(
              "h-4 w-4 text-[var(--color-brand-500)]",
              loading && "animate-pulse"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
