import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "py-8",
  default: "py-16",
  lg: "py-24",
};

const iconSizeMap = {
  sm: "h-8 w-8",
  default: "h-12 w-12",
  lg: "h-16 w-16",
};

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {Icon ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-fg)]",
            iconSizeMap[size],
          )}
        >
          <Icon className="h-1/2 w-1/2" aria-hidden="true" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-[var(--color-fg)]">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-[var(--color-muted-fg)] max-w-md">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
