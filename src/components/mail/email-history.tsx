"use client";

import { useState, useCallback } from "react";
import { History, RotateCcw, X, Clock, CheckCircle, Archive, Trash2, Tag, FolderOpen } from "lucide-react";

interface HistoryEntry {
  id: string;
  emailId: string;
  action: "received" | "read" | "unread" | "archived" | "deleted" | "moved" | "labeled" | "starred";
  description: string;
  timestamp: Date;
  actor: string;
  metadata?: Record<string, unknown>;
  restorable?: boolean;
}

interface EmailHistoryProps {
  open: boolean;
  emailId: string;
  onClose: () => void;
  onRestore?: (entryId: string) => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  received: <FolderOpen className="h-4 w-4" />,
  read: <CheckCircle className="h-4 w-4" />,
  unread: <CheckCircle className="h-4 w-4" />,
  archived: <Archive className="h-4 w-4" />,
  deleted: <Trash2 className="h-4 w-4" />,
  moved: <FolderOpen className="h-4 w-4" />,
  labeled: <Tag className="h-4 w-4" />,
  starred: <CheckCircle className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  received: "text-blue-400",
  read: "text-emerald-400",
  unread: "text-amber-400",
  archived: "text-[#C49B66]",
  deleted: "text-rose-400",
  moved: "text-purple-400",
  labeled: "text-cyan-400",
  starred: "text-amber-400",
};

export function EmailHistory({ open, emailId, onClose, onRestore }: EmailHistoryProps) {
  const [entries] = useState<HistoryEntry[]>([
    {
      id: "1",
      emailId,
      action: "received",
      description: "Email reçu",
      timestamp: new Date(Date.now() - 3600000),
      actor: "Système",
    },
    {
      id: "2",
      emailId,
      action: "read",
      description: "Marqué comme lu",
      timestamp: new Date(Date.now() - 1800000),
      actor: "Vous",
      restorable: true,
    },
    {
      id: "3",
      emailId,
      action: "labeled",
      description: "Label 'Important' ajouté",
      timestamp: new Date(Date.now() - 900000),
      actor: "Vous",
      restorable: true,
    },
  ]);

  const handleRestore = useCallback(
    (entryId: string) => {
      onRestore?.(entryId);
    },
    [onRestore],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Historique de l'email"
    >
      <div
        className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-[#C49B66]" />
            <h2 className="text-lg font-bold text-white">Historique</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white hover:border-[#C49B66]/40 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[#242427]" />

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="relative flex items-start gap-4 pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-[#121214] ${
                    entry.action === "received"
                      ? "bg-blue-500"
                      : entry.action === "read"
                      ? "bg-emerald-500"
                      : entry.action === "archived"
                      ? "bg-[#C49B66]"
                      : "bg-[#71717A]"
                  }`}
                />

                <div className="flex-1 p-3 rounded-lg bg-[#0A0A0B] border border-[#242427]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={ACTION_COLORS[entry.action]}>
                      {ACTION_ICONS[entry.action]}
                    </span>
                    <span className="text-sm text-[#E0E0E0]">{entry.description}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#71717A]">
                      <Clock className="h-3 w-3" />
                      <span>
                        {entry.timestamp.toLocaleString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span>• {entry.actor}</span>
                    </div>
                    {entry.restorable && onRestore && (
                      <button
                        onClick={() => handleRestore(entry.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#C49B66] hover:bg-[#1D1D20] transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {entries.length === 0 && (
          <div className="text-center py-8 text-sm text-[#71717A]">
            Aucun historique disponible pour cet email
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40 transition-colors"
      aria-label="Historique de l'email"
      title="Historique"
    >
      <History className="h-4 w-4" />
    </button>
  );
}

export default EmailHistory;
