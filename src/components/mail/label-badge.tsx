"use client";

/**
 * Reusable colored label badge.
 * Used in the email list and email view. Clicking filters by the label.
 */
import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabelStore } from "@/stores/label-store";
import type { Label } from "@/types/label";

interface LabelBadgeProps {
  /** Label id or a full label object. */
  label: string | Label;
  /** Called when the badge is clicked (e.g. to filter by label). */
  onClick?: (labelId: string) => void;
  /** Show an X button to remove the label (used in email view). */
  onRemove?: (labelId: string) => void;
  /** Render size. */
  size?: "sm" | "md";
  className?: string;
}

/** Resolve a label id or object to a full label using the store. */
function useResolvedLabel(label: string | Label): Label | undefined {
  const labels = useLabelStore((s) => s.labels);
  if (typeof label !== "string") return label;
  return labels.find((l) => l.id === label);
}

/** Get a Lucide icon component by kebab-case name. */
function getIcon(
  name: string
): React.ComponentType<{ className?: string }> | undefined {
  if (!name) return undefined;
  const pascal = name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  const icons = Icons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  return icons[pascal];
}

export function LabelBadge({
  label,
  onClick,
  onRemove,
  size = "sm",
  className,
}: LabelBadgeProps) {
  const resolved = useResolvedLabel(label);

  if (!resolved) {
    // Fallback: render the raw id without color.
    const id = typeof label === "string" ? label : label.id;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted-fg)]",
          className
        )}
      >
        {id.replace("label-", "")}
      </span>
    );
  }

  const Icon = getIcon(resolved.icon);
  const isInteractive = !!onClick;

  return (
    <span
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={
        isInteractive
          ? (e) => {
              e.stopPropagation();
              onClick(resolved.id);
            }
          : undefined
      }
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onClick(resolved.id);
              }
            }
          : undefined
      }
      data-testid={`label-badge-${resolved.id}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        isInteractive && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{
        backgroundColor: `${resolved.color}20`,
        color: resolved.color,
        border: `1px solid ${resolved.color}40`,
      }}
    >
      {Icon && <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />}
      <span>{resolved.name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove label ${resolved.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(resolved.id);
          }}
          className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
        >
          <Icons.X className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  );
}
