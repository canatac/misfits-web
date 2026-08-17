"use client";

import { useCallback, type RefObject } from "react";
import { OPERATOR_META, type OperatorMeta } from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";
import { useSearchStore } from "@/stores/search-store";

interface UseSearchBarHandlersOpts {
  inputRef: RefObject<HTMLInputElement | null>;
  setShowOperatorHints: (v: boolean) => void;
  setShowHistory: (v: boolean) => void;
}

export function useSearchBarHandlers({
  inputRef,
  setShowOperatorHints,
  setShowHistory,
}: UseSearchBarHandlersOpts) {
  const query = useSearchStore((s) => s.query);
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);
  const addHistoryEntry = useSearchStore((s) => s.addHistoryEntry);
  const saveSearch = useSearchStore((s) => s.saveSearch);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      const cursorPos = e.target.selectionStart ?? value.length;
      const activeOp = getActiveOperator(value, cursorPos);
      setShowOperatorHints(!!activeOp && activeOp.partial.length < 5);
      executeSearch();
    },
    [setSearchQuery, executeSearch, setShowOperatorHints]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) {
          addHistoryEntry(query);
          executeSearch();
        }
        setShowHistory(false);
        setShowOperatorHints(false);
      }
      if (e.key === "Escape") {
        if (query) {
          setSearchQuery("");
          executeSearch();
        }
        setShowOperatorHints(false);
        setShowHistory(false);
        inputRef.current?.blur();
      }
      if (e.key === "ArrowDown" && !query) {
        e.preventDefault();
        setShowHistory(true);
      }
    },
    [
      query,
      setSearchQuery,
      executeSearch,
      addHistoryEntry,
      inputRef,
      setShowHistory,
      setShowOperatorHints,
    ]
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    executeSearch();
    inputRef.current?.focus();
  }, [setSearchQuery, executeSearch, inputRef]);

  const handleSave = useCallback(() => {
    if (query.trim()) {
      const name = window.prompt("Save this search as:", query);
      if (name !== null) {
        saveSearch(name, query);
      }
    }
  }, [query, saveSearch]);

  const insertOperator = useCallback(
    (op: OperatorMeta) => {
      const cursorPos = inputRef.current?.selectionStart ?? query.length;
      const before = query.slice(0, cursorPos);
      const after = query.slice(cursorPos);
      const match = before.match(/(\w+:)(?:"([^"]*)"|'([^']*)'?|(\S*))$/);
      let newQuery: string;
      if (match) {
        const replaceStart = cursorPos - match[0].length;
        newQuery =
          query.slice(0, replaceStart) +
          (op.hasValue ? `${op.operator}:` : `${op.operator}: `) +
          after;
      } else {
        newQuery = before + `${op.operator}:` + (after ? " " + after : "");
      }
      setSearchQuery(newQuery);
      setShowOperatorHints(false);
      requestAnimationFrame(() => {
        const pos =
          (match ? cursorPos - match[0].length : cursorPos) +
          op.operator.length +
          1;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [query, setSearchQuery, inputRef, setShowOperatorHints]
  );

  const handleHistorySelect = useCallback(
    (q: string) => {
      setSearchQuery(q);
      executeSearch();
      setShowHistory(false);
    },
    [setSearchQuery, executeSearch, setShowHistory]
  );

  const activeOperator = (() => {
    const cursorPos = inputRef.current?.selectionStart ?? query.length;
    return getActiveOperator(query, cursorPos);
  })();

  const filteredOperators = activeOperator
    ? OPERATOR_META.filter(
        (op) =>
          op.operator.startsWith(activeOperator.operator) ||
          op.operator.includes(activeOperator.operator)
      )
    : OPERATOR_META;

  return {
    handleChange,
    handleKeyDown,
    handleClear,
    handleSave,
    insertOperator,
    handleHistorySelect,
    filteredOperators,
  };
}
