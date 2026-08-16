"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorBanner({
  message,
  className,
  ...rest
}: {
  message: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] p-3 text-sm text-[var(--color-danger-700)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-300)]",
        className,
      )}
      role="alert"
      aria-live="assertive"
      {...rest}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
