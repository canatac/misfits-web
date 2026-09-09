"use client";

import React from "react";
import { X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "J / K", label: "Message suivant / précédant", category: "Navigation" },
  { key: "C", label: "Nouveau message", category: "Actions" },
  { key: "E", label: "Archiver", category: "Actions" },
  { key: "#", label: "Supprimer", category: "Actions" },
  { key: "S", label: "Étoile / retirer l'étoile", category: "Actions" },
  { key: "U", label: "Marquer comme non lu", category: "Actions" },
  { key: "/", label: "Rechercher", category: "Navigation" },
  { key: "⌘/Ctrl + B", label: "Afficher / masquer la barre latérale", category: "Affichage" },
  { key: "⌘/Ctrl + J", label: "Afficher / masquer le panneau assistant", category: "Affichage" },
  { key: "Esc", label: "Fermer", category: "Navigation" },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Raccourcis clavier"
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Raccourcis clavier</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white hover:border-[#C49B66]/40 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-[#C49B66] uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0A0A0B] border border-[#242427]"
                  >
                    <span className="text-sm text-[#E0E0E0]">{s.label}</span>
                    <span className="px-2 py-1 rounded bg-[#1D1D20] text-[#C49B66] font-mono text-xs border border-[#242427]">
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#242427]">
          <p className="text-xs text-[#71717A] text-center">
            Appuyez sur <span className="px-1.5 py-0.5 rounded bg-[#1D1D20] text-[#C49B66] font-mono border border-[#242427]">Ctrl + /</span> pour ouvrir cette aide à tout moment
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
