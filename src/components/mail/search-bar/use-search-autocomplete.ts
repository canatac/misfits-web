"use client";

/**
 * Search operator autocomplete hook.
 *
 * Detects partial operator input (e.g. "fr") and provides inline
 * suggestions that the user can accept with Tab or Right arrow.
 * Mirrors the Superhuman / HEY pattern: typing "fr" suggests "from:",
 * and the suggestion text appears greyed-out inline after the cursor.
 */

import { useCallback, useMemo, useState } from "react";
import { OPERATOR_META, type OperatorMeta } from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";

interface AutocompleteState {
  /** The operator being suggested, or null if none */
  suggestion: OperatorMeta | null;
  /** The partial text the user has typed (e.g. "fr") */
  partial: string;
  /** Whether the autocomplete panel is visible */
  showPanel: boolean;
}

interface UseSearchAutocompleteReturn {
  autocomplete: AutocompleteState;
  /** Call when input value changes */
  updateAutocomplete: (value: string, cursorPos: number) => void;
  /** Accept the current suggestion (returns replacement text) */
  acceptSuggestion: (value: string, cursorPos: number) => string;
  /** Hide the autocomplete panel */
  dismiss: () => void;
  /** Filtered operators for the hints panel */
  filteredOperators: OperatorMeta[];
}

export function useSearchAutocomplete(): UseSearchAutocompleteReturn {
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
    suggestion: null,
    partial: "",
    showPanel: false,
  });

  const updateAutocomplete = useCallback(
    (value: string, cursorPos: number) => {
      const activeOp = getActiveOperator(value, cursorPos);

      if (!activeOp || activeOp.partial.length === 0) {
        setAutocomplete({ suggestion: null, partial: "", showPanel: false });
        return;
      }

      // Find matching operators
      const matches = OPERATOR_META.filter((op) =>
        op.operator.startsWith(activeOp.partial)
      );

      if (matches.length === 0) {
        setAutocomplete({ suggestion: null, partial: "", showPanel: false });
        return;
      }

      // Only suggest if we have a partial match (not exact)
      const exactMatch = matches.find(
        (op) => op.operator === activeOp.partial
      );

      if (exactMatch) {
        setAutocomplete({ suggestion: null, partial: "", showPanel: false });
        return;
      }

      // Show the best match as inline suggestion
      const bestMatch = matches[0];
      setAutocomplete({
        suggestion: bestMatch,
        partial: activeOp.partial,
        showPanel: matches.length > 1,
      });
    },
    []
  );

  const acceptSuggestion = useCallback(
    (value: string, cursorPos: number): string => {
      if (!autocomplete.suggestion) return value;

      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);

      // Replace partial with full operator
      const newBefore =
        before.slice(0, before.length - autocomplete.partial.length) +
        autocomplete.suggestion.operator +
        ":";

      const needsSpace = after.length > 0 && !after.startsWith(" ");
      return newBefore + (needsSpace ? " " + after : after);
    },
    [autocomplete]
  );

  const dismiss = useCallback(() => {
    setAutocomplete((prev) => ({ ...prev, showPanel: false }));
  }, []);

  const filteredOperators = useMemo(() => {
    if (!autocomplete.partial) return OPERATOR_META;
    return OPERATOR_META.filter((op) =>
      op.operator.startsWith(autocomplete.partial)
    );
  }, [autocomplete.partial]);

  return {
    autocomplete,
    updateAutocomplete,
    acceptSuggestion,
    dismiss,
    filteredOperators,
  };
}
