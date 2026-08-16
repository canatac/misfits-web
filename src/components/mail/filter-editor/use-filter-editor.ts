"use client";

import * as React from "react";
import { useFilterStore, testRule } from "@/stores/filter-store";
import { useEmailStore } from "@/stores/email-store";
import type { Filter } from "@/types/label";

export function useFilterEditor() {
  const rules = useFilterStore((s) => s.rules);
  const createRule = useFilterStore((s) => s.createRule);
  const updateRule = useFilterStore((s) => s.updateRule);
  const deleteRule = useFilterStore((s) => s.deleteRule);
  const toggleRule = useFilterStore((s) => s.toggleRule);
  const importRules = useFilterStore((s) => s.importRules);
  const exportRules = useFilterStore((s) => s.exportRules);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [draft, setDraft] = React.useState<Filter | null>(null);
  const [testResult, setTestResult] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function newDraft(): Filter {
    return {
      id: `draft-${Date.now()}`,
      name: "New rule",
      conditions: [{ field: "from", operator: "contains", value: "" }],
      actions: [{ type: "label", params: {} }],
      enabled: true,
      priority: rules.length,
      createdAt: new Date().toISOString(),
    };
  }

  function startCreate() {
    setEditingId(null);
    setIsCreating(true);
    setDraft(newDraft());
    setTestResult(null);
  }

  function startEdit(rule: Filter) {
    setEditingId(rule.id);
    setIsCreating(false);
    setDraft({
      ...rule,
      conditions: rule.conditions.map((c) => ({ ...c })),
      actions: rule.actions.map((a) => ({ ...a })),
    });
    setTestResult(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setDraft(null);
    setTestResult(null);
  }

  function handleSave() {
    if (!draft) return;
    if (editingId) {
      updateRule(editingId, {
        name: draft.name,
        conditions: draft.conditions,
        actions: draft.actions,
        enabled: draft.enabled,
      });
    } else {
      createRule({
        name: draft.name,
        conditions: draft.conditions,
        actions: draft.actions,
        enabled: draft.enabled,
      });
    }
    cancelEdit();
  }

  function handleTest() {
    if (!draft) return;
    const emails = useEmailStore.getState().emails;
    const matches = testRule(draft, emails);
    setTestResult(matches.length);
  }

  function handleExport() {
    const json = exportRules();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "misfits-filters.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const count = importRules(text);
      if (count === 0) {
        alert("No valid rules found in the file.");
      }
    });
    e.target.value = "";
  }

  return {
    rules,
    deleteRule,
    toggleRule,
    editingId,
    isCreating,
    draft,
    setDraft,
    testResult,
    fileInputRef,
    startCreate,
    startEdit,
    cancelEdit,
    handleSave,
    handleTest,
    handleExport,
    handleImportClick,
    handleImportFile,
    showForm: isCreating || !!editingId,
  };
}
