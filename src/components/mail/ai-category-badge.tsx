"use client";

import { useState, useMemo, useCallback } from "react";
import { categorizeEmail, calculatePriority, suggestAction } from "@/lib/ai-triage";
import { Brain, Pause, Play, Settings, X, AlertTriangle, Info, Archive, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";

type EmailCategory = "urgent" | "action_required" | "informative" | "newsletter" | "promo" | "notification" | "social" | "personal" | "work" | "important";

interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG: Record<EmailCategory, CategoryConfig> = {
  urgent: { label: "Urgent", color: "text-rose-400", bgColor: "bg-rose-500/20", borderColor: "border-rose-500/40", icon: <AlertTriangle className="h-3 w-3" /> },
  action_required: { label: "Action requise", color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/40", icon: <Mail className="h-3 w-3" /> },
  informative: { label: "Informatif", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/40", icon: <Info className="h-3 w-3" /> },
  newsletter: { label: "Newsletter", color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-500/40", icon: <Archive className="h-3 w-3" /> },
  promo: { label: "Promotion", color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/40", icon: <Archive className="h-3 w-3" /> },
  notification: { label: "Notification", color: "text-cyan-400", bgColor: "bg-cyan-500/20", borderColor: "border-cyan-500/40", icon: <Info className="h-3 w-3" /> },
  social: { label: "Social", color: "text-pink-400", bgColor: "bg-pink-500/20", borderColor: "border-pink-500/40", icon: <Info className="h-3 w-3" /> },
  personal: { label: "Personnel", color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/40", icon: <Mail className="h-3 w-3" /> },
  work: { label: "Travail", color: "text-amber-400", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/40", icon: <Mail className="h-3 w-3" /> },
  important: { label: "Important", color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500/40", icon: <AlertTriangle className="h-3 w-3" /> },
};

interface EmailCategoryBadgeProps {
  emailId: string;
  subject: string;
  preview: string;
  from: { name: string; address: string };
  isImportant: boolean;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  onCategoryChange?: (emailId: string, category: EmailCategory) => void;
}

export function EmailCategoryBadge({
  emailId,
  subject,
  preview,
  from,
  isImportant,
  isRead,
  isStarred,
  hasAttachments,
  onCategoryChange,
}: EmailCategoryBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);

  const mockEmail: Email = {
    id: emailId,
    subject,
    preview,
    from,
    isImportant,
    isRead,
    isStarred,
    hasAttachments,
    labels: [],
    to: [],
    cc: [],
    bcc: [],
    replyTo: undefined,
    date: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    body: "",
    bodyType: "text",
    threadId: "",
    folder: "inbox",
    attachments: [],
    size: 0,
    messageId: "",
    references: [],
    headers: {},
    accountId: undefined,
  };

  const { category, confidence } = categorizeEmail(mockEmail);
  const priority = calculatePriority(mockEmail);
  const config = CATEGORY_CONFIG[category];

  const handleCategoryClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSelectCategory = useCallback((newCategory: EmailCategory) => {
    onCategoryChange?.(emailId, newCategory);
    setIsEditing(false);
  }, [emailId, onCategoryChange]);

  if (isEditing) {
    return (
      <div className="absolute left-0 top-0 z-10 flex flex-wrap gap-1 rounded-lg border border-[#242427] bg-[#121214] p-2 shadow-xl">
        {(Object.keys(CATEGORY_CONFIG) as EmailCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCategory(cat)}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors",
              CATEGORY_CONFIG[cat].bgColor,
              CATEGORY_CONFIG[cat].color,
              CATEGORY_CONFIG[cat].borderColor,
            )}
          >
            {CATEGORY_CONFIG[cat].icon}
            {CATEGORY_CONFIG[cat].label}
          </button>
        ))}
        <button
          onClick={() => setIsEditing(false)}
          className="rounded-full p-0.5 text-[#71717A] hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCategoryClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition-colors",
        config.bgColor,
        config.color,
        config.borderColor,
      )}
      title={`Catégorie: ${config.label} (confidence: ${Math.round(confidence * 100)}%)`}
    >
      {config.icon}
      {config.label}
    </button>
  );
}

export function AICategorizationBanner({
  isActive,
  onToggle,
  onOpenSettings,
}: {
  isActive: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2">
      <div className="flex items-center gap-2">
        <Brain className={cn("h-4 w-4", isActive ? "text-[#C49B66]" : "text-[#71717A]")} />
        <span className="text-xs text-[#E0E0E0]">Catégorisation IA</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-[#1D1D20] text-[#71717A]")}>
          {isActive ? "Active" : "En pause"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSettings}
          className="rounded p-1 text-[#71717A] hover:bg-[#1D1D20] hover:text-white"
          aria-label="Paramètres de catégorisation"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onToggle}
          className="rounded p-1 text-[#71717A] hover:bg-[#1D1D20] hover:text-white"
          aria-label={isActive ? "Pause la catégorisation" : "Activer la catégorisation"}
        >
          {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function useAICategorization() {
  const [isActive, setIsActive] = useState(true);
  const [userCorrections, setUserCorrections] = useState<Record<string, EmailCategory>>({});

  const toggleActive = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const correctCategory = useCallback((emailId: string, category: EmailCategory) => {
    setUserCorrections((prev) => ({ ...prev, [emailId]: category }));
  }, []);

  const getCategory = useCallback((emailId: string, suggestedCategory: EmailCategory) => {
    return userCorrections[emailId] || suggestedCategory;
  }, [userCorrections]);

  return {
    isActive,
    toggleActive,
    correctCategory,
    getCategory,
    userCorrections,
  };
}

export default EmailCategoryBadge;
