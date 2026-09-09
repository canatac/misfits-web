"use client";

import React, { useState, useMemo } from "react";
import { X, Search, HelpCircle } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "J / K", label: "Message suivant / précédent", category: "Navigation" },
  { key: "G", label: "Aller au dossier", category: "Navigation" },
  { key: "C", label: "Composer un message", category: "Actions" },
  { key: "E", label: "Archiver", category: "Actions" },
  { key: "#", label: "Supprimer", category: "Actions" },
  { key: "R", label: "Répondre", category: "Actions" },
  { key: "A", label: "Répondre à tous", category: "Actions" },
  { key: "S", label: "Étoile / retirer l'étoile", category: "Actions" },
  { key: "U", label: "Marquer comme non lu", category: "Actions" },
  { key: "/", label: "Rechercher", category: "Recherche" },
  { key: "⌘/Ctrl + K", label: "Palette de commandes", category: "Recherche" },
  { key: "⌘/Ctrl + B", label: "Afficher / masquer la barre latérale", category: "Affichage" },
  { key: "⌘/Ctrl + J", label: "Afficher / masquer le panneau assistant", category: "Affichage" },
  { key: "⌘/Ctrl + /", label: "Afficher cette aide", category: "Navigation" },
  { key: "Esc", label: "Fermer", category: "Navigation" },
  { key: "⌘/Ctrl + Enter", label: "Envoyer le message", category: "Édition" },
  { key: "⌘/Ctrl + Z", label: "Annuler", category: "Édition" },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUTS;
    const query = searchQuery.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(query) ||
        s.key.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const categories = [...new Set(filteredShortcuts.map((s) => s.category))];

  if (!open) return null;

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Raccourcis clavier</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white hover:border-[#C49B66]/40 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search field */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les raccourcis..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A0B] border border-[#242427] text-sm text-white placeholder-[#71717A] outline-none focus:border-[#C49B66]/40"
          />
        </div>

        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#71717A]">
              Aucun raccourci trouvé pour &quot;{searchQuery}&quot;
            </div>
          ) : (
            categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-[#C49B66] uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {filteredShortcuts
                    .filter((s) => s.category === category)
                    .map((s) => (
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
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#242427]">
          <p className="text-xs text-[#71717A] text-center">
            Appuyez sur{" "}
            <span className="px-1.5 py-0.5 rounded bg-[#1D1D20] text-[#C49B66] font-mono border border-[#242427]">
              Ctrl + /
            </span>{" "}
            pour ouvrir cette aide à tout moment
          </p>
        </div>
      </div>
    </div>
  );
};

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-[#C49B66] hover:border-[#C49B66]/40 transition-colors"
      aria-label="Aide raccourcis clavier"
      title="Raccourcis clavier (Ctrl+/)"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}

export default KeyboardShortcutsHelp;
