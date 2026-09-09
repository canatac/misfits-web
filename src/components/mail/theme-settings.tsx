"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

const STORAGE_KEY = "misfits_theme_preference";

interface ThemeConfig {
  value: ThemeOption;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const THEME_OPTIONS: ThemeConfig[] = [
  {
    value: "system",
    label: "Automatique (système)",
    icon: <Monitor className="h-5 w-5" />,
    description: "S'adapter aux préférences de votre système d'exploitation",
  },
  {
    value: "light",
    label: "Clair",
    icon: <Sun className="h-5 w-5" />,
    description: "Thème clair en permanence",
  },
  {
    value: "dark",
    label: "Sombre",
    icon: <Moon className="h-5 w-5" />,
    description: "Thème sombre en permanence",
  },
];

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["light", "dark", "system"].includes(stored)) {
        setTheme(stored as ThemeOption);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateTheme = (newTheme: ThemeOption) => {
    setIsTransitioning(true);
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    // Apply theme to document
    const root = document.documentElement;
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }

    // End transition after animation
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return { theme, updateTheme, isTransitioning };
}

export function ThemeSettingsPanel() {
  const { theme, updateTheme, isTransitioning } = useThemePreference();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-2">Apparence</h2>
        <p className="text-sm text-[#71717A]">
          Personnalisez l'apparence de l'application selon vos préférences.
        </p>
      </div>

      <div className="space-y-2">
        {THEME_OPTIONS.map((option) => {
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              onClick={() => updateTheme(option.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                isActive
                  ? "bg-[#C49B66]/10 border-[#C49B66]/40"
                  : "bg-[#0A0A0B] border-[#242427] hover:border-[#C49B66]/20",
                isTransitioning && "opacity-70"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  isActive ? "bg-[#C49B66]/20 text-[#C49B66]" : "bg-[#1D1D20] text-[#71717A]"
                )}
              >
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", isActive ? "text-[#C49B66]" : "text-[#E0E0E0]")}>
                    {option.label}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-[#C49B66]/20 px-1.5 py-0.5 text-[10px] text-[#C49B66]">
                      <Check className="h-2.5 w-2.5" />
                      Actif
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">{option.description}</p>
              </div>
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-colors",
                  isActive ? "border-[#C49B66] bg-[#C49B66]" : "border-[#242427]"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* System detection indicator */}
      <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
        <div className="flex items-center gap-2 text-xs text-[#71717A]">
          <Monitor className="h-3 w-3" />
          <span>
            Détection système :{" "}
            <span className="text-[#C49B66]">
              {window.matchMedia("(prefers-color-scheme: dark)").matches ? "Sombre" : "Clair"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function ThemeToggleCompact() {
  const { theme, updateTheme, isTransitioning } = useThemePreference();

  const currentOption = THEME_OPTIONS.find((o) => o.value === theme);
  const Icon = currentOption?.icon || <Monitor className="h-4 w-4" />;

  const cycleTheme = () => {
    const themes: ThemeOption[] = ["system", "light", "dark"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "p-2 rounded-lg border transition-all duration-300",
        "bg-[#1D1D20] border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40",
        isTransitioning && "opacity-70"
      )}
      title={`Thème: ${currentOption?.label || "Système"}`}
      aria-label="Changer de thème"
    >
      {Icon}
    </button>
  );
}

export default ThemeSettingsPanel;
