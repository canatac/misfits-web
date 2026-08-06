"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BookOpen,
  Calendar,
  Contact,
  LayoutDashboard,
  Languages,
  Mail,
  Newspaper,
  PenSquare,
  Settings2,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefix?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/mail", label: "Mail", icon: Mail, matchPrefix: "/mail" },
  { href: "/compose", label: "Compose", icon: PenSquare, matchPrefix: "/compose" },
  { href: "/contacts", label: "Contacts", icon: Contact, matchPrefix: "/contacts" },
  { href: "/calendar", label: "Calendar", icon: Calendar, matchPrefix: "/calendar" },
  { href: "/newsletters", label: "Newsletters", icon: Newspaper, matchPrefix: "/newsletters" },
  { href: "/translation", label: "Translation", icon: Languages, matchPrefix: "/translation" },
  { href: "/docs", label: "Docs", icon: BookOpen, matchPrefix: "/docs" },
  {
    href: "/dashboard/monitoring",
    label: "Monitoring",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard/monitoring",
  },
  {
    href: "/dashboard/security",
    label: "Security",
    icon: ShieldAlert,
    matchPrefix: "/dashboard/security",
  },
  { href: "/admin", label: "Admin", icon: Wrench, matchPrefix: "/admin" },
  { href: "/settings/ai", label: "Settings", icon: Settings2, matchPrefix: "/settings" },
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

  return (
    <nav
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 py-2 backdrop-blur",
        className,
      )}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex w-full max-w-[1500px] gap-1 overflow-x-auto">
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
                  : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-fg)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
