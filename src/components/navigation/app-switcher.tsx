"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BookOpen,
  Calendar,
  Languages,
  LayoutDashboard,
  Mail,
  Newspaper,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

type NavItem = {
  href: string;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefix?: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard",
  },
  { href: "/mail", labelKey: "nav.mail", icon: Mail, matchPrefix: "/mail" },
  {
    href: "/compose",
    labelKey: "nav.compose",
    icon: PenSquare,
    matchPrefix: "/compose",
  },
  {
    href: "/calendar",
    labelKey: "nav.calendar",
    icon: Calendar,
    matchPrefix: "/calendar",
  },
  {
    href: "/newsletters",
    labelKey: "nav.newsletters",
    icon: Newspaper,
    matchPrefix: "/newsletters",
  },
  {
    href: "/translation",
    labelKey: "nav.translation",
    icon: Languages,
    matchPrefix: "/translation",
  },
  { href: "/docs", labelKey: "nav.docs", icon: BookOpen, matchPrefix: "/docs" },
];

interface AppSwitcherProps {
  className?: string;
}

function isActivePath(pathname: string, item: NavItem): boolean {
  const prefix = item.matchPrefix ?? item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function AppSwitcher({ className }: AppSwitcherProps) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();

  return (
    <nav
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 py-2 backdrop-blur",
        className
      )}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex w-full max-w-[1500px] items-center gap-2 overflow-x-auto">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>

        <label className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#242427] bg-[#121214] px-2 py-1 text-xs text-[#A1A1AA]">
          <span>{t("nav.language")}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded border border-[#242427] bg-[#0A0A0B] px-1.5 py-0.5 text-xs text-[#E0E0E0]"
          >
            {SUPPORTED_LOCALES.map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
