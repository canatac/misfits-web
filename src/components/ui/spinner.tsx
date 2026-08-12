import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
};

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = "default", ...props }, ref) => (
    <svg
      ref={ref}
      className={cn(
        "animate-spin text-[var(--color-muted-fg)]",
        sizeMap[size],
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
);
Spinner.displayName = "Spinner";

export { Spinner };
