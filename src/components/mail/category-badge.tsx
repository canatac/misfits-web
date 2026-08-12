"use client";
import { cn } from "@/lib/utils";
import type { EmailCategory } from "@/types/ai-triage";
import { Star, Mail, Bell, Tag, Share2, User, Briefcase } from "lucide-react";

const CATEGORY_CONFIG: Record<
  EmailCategory,
  { color: string; bg: string; icon: typeof Star; label: string }
> = {
  important: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: Star,
    label: "Important",
  },
  newsletter: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: Mail,
    label: "Newsletter",
  },
  notification: {
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    icon: Bell,
    label: "Notification",
  },
  promo: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: Tag,
    label: "Promo",
  },
  social: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: Share2,
    label: "Social",
  },
  personal: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: User,
    label: "Personal",
  },
  work: {
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    icon: Briefcase,
    label: "Work",
  },
};

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: EmailCategory;
  size?: "sm" | "md";
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bg,
        config.color,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {config.label}
    </span>
  );
}
