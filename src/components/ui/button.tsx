import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-brand-500)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)]",
        destructive:
          "bg-[var(--color-danger-500)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-danger-600)] active:bg-[var(--color-danger-700)]",
        outline:
          "border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]",
        secondary:
          "bg-[var(--color-muted)] text-[var(--color-fg)] hover:bg-[var(--color-muted)]/80",
        ghost:
          "text-[var(--color-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]",
        link: "text-[var(--color-brand-500)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
