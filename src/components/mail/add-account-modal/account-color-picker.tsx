"use client";

import * as React from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ACCOUNT_COLORS, type ValidationResult } from "@/lib/account-presets";

interface ColorPickerProps {
  color: string;
  customColor: string;
  onSelectColor: (c: string) => void;
  onCustomColorChange: (c: string) => void;
  accountsCount: number;
}

export function AccountColorPicker({
  color,
  customColor,
  onSelectColor,
  onCustomColorChange,
  accountsCount,
}: ColorPickerProps) {
  const activeColor = customColor || color;
  return (
    <div className="grid gap-2">
      <Label>Account color</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {ACCOUNT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onSelectColor(c)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform",
              !customColor && color === c
                ? "scale-110 border-[var(--color-fg)]"
                : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)]">
          <input
            type="color"
            value={customColor || color}
            onChange={(e) => onCustomColorChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom color"
          />
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: activeColor }}
            aria-hidden="true"
          />
        </label>
        <span className="ml-1 text-xs text-[var(--color-muted-fg)]">
          {accountsCount} account(s) connected
        </span>
      </div>
    </div>
  );
}

export function TestResultBanner({ testResult }: { testResult: ValidationResult | null }) {
  if (!testResult) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-sm",
        testResult.ok
          ? "border-[var(--color-success-500)] bg-[var(--color-success)] text-[var(--color-success-fg)]"
          : "border-[var(--color-danger-500)] bg-[var(--color-danger)] text-[var(--color-danger-fg)]"
      )}
      role={testResult.ok ? "status" : "alert"}
    >
      {testResult.ok ? (
        <>
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Connection validated. Settings look good.</span>
        </>
      ) : (
        <>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {testResult.errors.map((err) => (
              <span key={err}>{err}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
