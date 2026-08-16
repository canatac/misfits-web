"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar as CalendarIcon,
  Languages,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "dashboard-link" },
  { href: "/docs", label: "Docs", icon: BookOpen, testId: "docs-link" },
  { href: "/admin", label: "Console Admin", icon: ShieldCheck, testId: "admin-link" },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, testId: "calendar-link" },
  { href: "/newsletters", label: "Newsletters", icon: Newspaper, testId: "newsletters-link" },
  { href: "/translation", label: "Translation", icon: Languages, testId: "translation-link" },
] as const;

export function WorkspaceNavItems() {
  const pathname = usePathname();
  const isActivePath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  const navClass = (active: boolean) =>
    cn(
      "w-full justify-start gap-2 border border-[#262629] bg-[#141417] text-[#E4E4E7] hover:bg-[#1B1B1F]",
      active &&
        "border-[#C49B66]/50 bg-[#1E1A15] text-[#F2D5A7] hover:bg-[#1E1A15]"
    );
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon, testId }) => (
        <div key={href} className="px-3 pb-2">
          <Button
            asChild
            variant="outline"
            className={navClass(isActivePath(href))}
            data-testid={testId}
          >
            <Link href={href}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </Button>
        </div>
      ))}
    </>
  );
}
