import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-brand-500)] text-white",
        secondary:
          "border-transparent bg-[var(--color-muted)] text-[var(--color-fg)]",
        destructive:
          "border-transparent bg-[var(--color-danger-500)] text-white",
        outline: "border-[var(--color-border)] text-[var(--color-fg)]",
        success: "border-transparent bg-[var(--color-success-500)] text-white",
        warning: "border-transparent bg-[var(--color-warning-500)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
