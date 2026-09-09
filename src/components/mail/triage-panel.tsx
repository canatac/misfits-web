"use client";

import { useState, useMemo } from "react";
import { useEmailList } from "@/hooks/use-emails";
import { calculatePriority, categorizeEmail, suggestAction } from "@/lib/ai-triage";
import { Check, X, Archive, Mail, Reply, Star, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type TriageCategory = "urgent" | "action_required" | "informative" | "newsletter" | "spam";

interface TriageItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  suggestedCategory: TriageCategory;
  suggestedAction: string;
  priority: number;
}

interface TriagePanelProps {
  open: boolean;
  onClose: () => void;
  onApplyAction: (emailId: string, action: string) => void;
}

const CATEGORY_CONFIG: Record<TriageCategory, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "text-rose-400", bgColor: "bg-rose-500/20" },
  action_required: { label: "Action requise", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  informative: { label: "Informatif", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  newsletter: { label: "Newsletter", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  spam: { label: "Spam", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
};

const ACTION_LABELS: Record<string, string> = {
  reply: "Répondre",
  archive: "Archiver",
  mark_read: "Marquer lu",
  follow_up: "Suivre",
  delete: "Supprimer",
};

export function TriagePanel({ open, onClose, onApplyAction }: TriagePanelProps) {
  const inboxQuery = useEmailList({ folder: "inbox", page: 1, pageSize: 50, sortBy: "date" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const triageItems = useMemo(() => {
    const emails = inboxQuery.data?.emails ?? [];
    return emails
      .filter((e) => !e.isRead && !processedIds.has(e.id))
      .map((email) => {
        const { category } = categorizeEmail(email);
        const priority = calculatePriority(email);
        const action = suggestAction(email, category, priority);

        let triageCategory: TriageCategory = "informative";
        if (priority >= 70) triageCategory = "urgent";
        else if (category === "newsletter" || category === "promo") triageCategory = "newsletter";
        else if (category === "notification" && priority < 40) triageCategory = "informative";
        else if (priority >= 50) triageCategory = "action_required";

        return {
          id: email.id,
          from: email.from.name || email.from.address,
          subject: email.subject,
          preview: email.preview,
          suggestedCategory: triageCategory,
          suggestedAction: action,
          priority,
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [inboxQuery.data?.emails, processedIds]);

  const currentItem = triageItems[currentIndex];
  const remainingCount = triageItems.length - currentIndex;

  const handleAction = (action: string) => {
    if (!currentItem) return;
    onApplyAction(currentItem.id, action);
    setProcessedIds((prev) => new Set([...prev, currentItem.id]));
    setCurrentIndex((prev) => Math.min(prev + 1, triageItems.length - 1));
  };

  const handleSkip = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, triageItems.length - 1));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Triage intelligent</h2>
            <p className="text-xs text-[#71717A]">{remainingCount} email{remainingCount > 1 ? "s" : ""} à trier</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!currentItem ? (
          <div className="text-center py-12">
            <Check className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-sm text-[#E0E0E0]">Tous les emails ont été triés !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email preview */}
            <div className="p-4 rounded-xl bg-[#0A0A0B] border border-[#242427]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-[#E0E0E0]">{currentItem.from}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs", CATEGORY_CONFIG[currentItem.suggestedCategory].bgColor, CATEGORY_CONFIG[currentItem.suggestedCategory].color)}>
                  {CATEGORY_CONFIG[currentItem.suggestedCategory].label}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{currentItem.subject}</h3>
              <p className="text-xs text-[#71717A] line-clamp-2">{currentItem.preview}</p>
            </div>

            {/* Suggested action */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#1D1D20] border border-[#242427]">
              <span className="text-xs text-[#71717A]">Action suggérée :</span>
              <span className="text-xs text-[#C49B66] font-medium">
                {ACTION_LABELS[currentItem.suggestedAction] || currentItem.suggestedAction}
              </span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction("reply")}
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span className="text-sm">Répondre</span>
              </button>
              <button
                onClick={() => handleAction("archive")}
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#C49B66]/20 border border-[#C49B66]/40 text-[#C49B66] hover:bg-[#C49B66]/30 transition-colors"
              >
                <Archive className="h-4 w-4" />
                <span className="text-sm">Archiver</span>
              </button>
              <button
                onClick={() => handleAction("mark_read")}
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">Marquer lu</span>
              </button>
              <button
                onClick={() => handleAction("delete")}
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Supprimer</span>
              </button>
            </div>

            {/* Skip button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#242427]">
              <button
                onClick={handleSkip}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-[#71717A] hover:text-white hover:bg-[#1D1D20] transition-colors"
              >
                Passer
                <ChevronRight className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#71717A]">{currentIndex + 1} / {triageItems.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TriageButton({ onClick, count }: { onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40 transition-colors"
      aria-label="Triage intelligent"
      title="Triage intelligent"
    >
      <Star className="h-4 w-4" />
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C49B66] text-[10px] text-white flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export default TriagePanel;
