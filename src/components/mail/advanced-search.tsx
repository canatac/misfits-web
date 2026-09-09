"use client";

import { useState, useCallback } from "react";
import { Search, X, Calendar, User, Tag, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type BooleanOperator = "AND" | "OR" | "NOT";

interface SearchCondition {
  id: string;
  field: "all" | "from" | "to" | "subject" | "body" | "date" | "label";
  value: string;
  operator: BooleanOperator;
}

interface AdvancedSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (conditions: SearchCondition[]) => void;
  onSave?: (conditions: SearchCondition[]) => void;
}

const OPERATOR_STYLES: Record<BooleanOperator, { bg: string; text: string; border: string }> = {
  AND: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40" },
  OR: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40" },
  NOT: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/40" },
};

const FIELD_OPTIONS = [
  { value: "all", label: "Tous les termes" },
  { value: "from", label: "Expéditeur" },
  { value: "to", label: "Destinataire" },
  { value: "subject", label: "Sujet" },
  { value: "body", label: "Corps" },
  { value: "date", label: "Date" },
  { value: "label", label: "Label" },
];

export function AdvancedSearch({ open, onClose, onSearch, onSave }: AdvancedSearchProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([
    { id: "1", field: "all", value: "", operator: "AND" },
  ]);

  const addCondition = useCallback(() => {
    setConditions((prev) => [
      ...prev,
      { id: Date.now().toString(), field: "all", value: "", operator: "AND" },
    ]);
  }, []);

  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCondition = useCallback(
    (id: string, updates: Partial<SearchCondition>) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const handleSearch = () => {
    const validConditions = conditions.filter((c) => c.value.trim() !== "");
    if (validConditions.length > 0) {
      onSearch(validConditions);
    }
  };

  const handleSave = () => {
    const validConditions = conditions.filter((c) => c.value.trim() !== "");
    if (validConditions.length > 0 && onSave) {
      onSave(validConditions);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche avancée"
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[#121214] border border-[#242427] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-[#C49B66]" />
            <h2 className="text-lg font-bold text-white">Recherche avancée</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#A1A1AA] hover:text-white hover:border-[#C49B66]/40 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-3">
              {index > 0 && (
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(condition.id, {
                      operator: e.target.value as BooleanOperator,
                    })
                  }
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium",
                    OPERATOR_STYLES[condition.operator].bg,
                    OPERATOR_STYLES[condition.operator].text,
                    OPERATOR_STYLES[condition.operator].border,
                  )}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                  <option value="NOT">NOT</option>
                </select>
              )}

              <select
                value={condition.field}
                onChange={(e) =>
                  updateCondition(condition.id, { field: e.target.value as SearchCondition["field"] })
                }
                className="px-3 py-2 rounded-lg bg-[#0A0A0B] border border-[#242427] text-sm text-[#E0E0E0]"
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                placeholder="Terme de recherche..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#0A0A0B] border border-[#242427] text-sm text-white placeholder-[#71717A] outline-none focus:border-[#C49B66]/40"
              />

              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-2 rounded-lg bg-[#1D1D20] border border-[#242427] text-[#71717A] hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addCondition}
          className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg text-sm text-[#71717A] hover:text-[#C49B66] hover:bg-[#1D1D20] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une condition
        </button>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#242427]">
          <div className="flex items-center gap-4 text-xs text-[#71717A]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              AND
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              OR
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              NOT
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm text-[#C49B66] border border-[#C49B66]/40 hover:bg-[#C49B66]/10 transition-colors"
              >
                Sauvegarder
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg text-sm bg-[#C49B66] text-white hover:bg-[#C49B66]/80 transition-colors"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedSearch;
