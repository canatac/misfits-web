/**
 * Password strength indicator — visual bar + text label.
 * Shared by the login and password-reset pages.
 */

"use client";

import { cn } from "@/lib/utils";
import { evaluatePasswordStrength } from "@/lib/password-strength";

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { label, color, percent } = evaluatePasswordStrength(password);

  if (!password) return null;

  return (
    <div
      className="mt-2 flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]"
        aria-hidden="true"
      >
        <div
          className={cn("h-full rounded-full transition-all duration-200")}
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="w-20 shrink-0 text-right text-xs font-medium tabular-nums"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
