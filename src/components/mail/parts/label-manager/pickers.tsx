"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LABEL_COLORS, LABEL_ICONS } from "@/stores/label-store";

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

export function ColorPicker({
  value,
  customValue,
  onPresetChange,
  onCustomChange,
}: {
  value: string;
  customValue: string;
  onPresetChange: (color: string) => void;
  onCustomChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {LABEL_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onPresetChange(c)}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform",
            !customValue && value === c
              ? "scale-110 border-[var(--color-fg)]"
              : "border-transparent hover:scale-110"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="relative ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)]">
        <input
          type="color"
          value={customValue || value}
          onChange={(e) => onCustomChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Custom color"
        />
        <Icons.Palette className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
      </label>
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="No icon" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No icon</SelectItem>
        {LABEL_ICONS.map((name) => {
          const Icon = getIcon(name);
          return (
            <SelectItem key={name} value={name}>
              <span className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
