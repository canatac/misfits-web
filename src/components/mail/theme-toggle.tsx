"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", icon: Sun, label: "Clair" },
    { value: "dark", icon: Moon, label: "Sombre" },
    { value: "system", icon: Monitor, label: "Système" },
  ] as const;

  return (
    <div
      className="flex items-center gap-1 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] p-1"
      role="radiogroup"
      aria-label="Thème"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isActive
                ? "bg-[var(--color-brand-500)] text-white"
                : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]",
            )}
            aria-label={opt.label}
            aria-checked={isActive}
            role="radio"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
