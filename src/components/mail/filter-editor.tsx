"use client";

/**
 * Filter Editor — visual no-code rule builder (IF [conditions] THEN [actions]).
 * Add/remove conditions & actions, enable/disable toggle, test rule, import/export.
 */
import * as React from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Play,
  Upload,
  Download,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
} from "@/components/ui/modal";
import {
  useFilterStore,
  CONDITION_FIELD_LABELS,
  CONDITION_OPERATOR_LABELS,
  ACTION_TYPE_LABELS,
  testRule,
} from "@/stores/filter-store";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";
import type {
  Filter,
  FilterCondition,
  FilterAction,
  ConditionField,
  ConditionOperator,
  ActionType,
} from "@/types/label";
import type { Folder } from "@/types/email";

const FIELDS = Object.keys(CONDITION_FIELD_LABELS) as ConditionField[];
const OPERATORS = Object.keys(CONDITION_OPERATOR_LABELS) as ConditionOperator[];
const ACTION_TYPES = Object.keys(ACTION_TYPE_LABELS) as ActionType[];
const FOLDERS: Folder[] = [
  "inbox",
  "sent",
  "drafts",
  "archive",
  "trash",
  "spam",
];

interface FilterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterEditor({ open, onOpenChange }: FilterEditorProps) {
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
    // Use all emails from the email store as the corpus.
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

  const showForm = isCreating || !!editingId;

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) cancelEdit();
        onOpenChange(o);
      }}
    >
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <ModalTitle>Filter rules</ModalTitle>
          <ModalDescription>
            Rules run automatically on incoming email. Conditions use AND logic.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rules ({rules.length})</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExport}
                disabled={rules.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button size="sm" variant="ghost" onClick={handleImportClick}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={startCreate}
                disabled={showForm}
              >
                <Plus className="h-4 w-4" />
                New rule
              </Button>
            </div>
          </div>

          {showForm && draft ? (
            <RuleForm
              draft={draft}
              onChange={setDraft}
              onTest={handleTest}
              testResult={testResult}
            />
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {rules.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--color-muted-fg)]">
                  No rules yet. Click “New rule” to build one.
                </p>
              )}
              {rules
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                  >
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                      aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {rule.name}
                        </span>
                        {!rule.enabled && (
                          <Badge variant="secondary" className="text-[10px]">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-[var(--color-muted-fg)]">
                        {rule.conditions.length} condition
                        {rule.conditions.length !== 1 ? "s" : ""} ·{" "}
                        {rule.actions.length} action
                        {rule.actions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(rule)}
                      aria-label="Edit rule"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRule(rule.id)}
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {showForm ? (
            <>
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!draft?.name.trim()}>
                <Save className="h-4 w-4" />
                {editingId ? "Save changes" : "Create rule"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Rule form                                                          */
/* ------------------------------------------------------------------ */

function RuleForm({
  draft,
  onChange,
  onTest,
  testResult,
}: {
  draft: Filter;
  onChange: (draft: Filter) => void;
  onTest: () => void;
  testResult: number | null;
}) {
  const labels = useLabelStore((s) => s.labels);

  function updateName(name: string) {
    onChange({ ...draft, name });
  }

  function updateCondition(idx: number, patch: Partial<FilterCondition>) {
    const conditions = draft.conditions.map((c, i) =>
      i === idx ? { ...c, ...patch } : c
    );
    onChange({ ...draft, conditions });
  }

  function addCondition() {
    onChange({
      ...draft,
      conditions: [
        ...draft.conditions,
        { field: "from", operator: "contains", value: "" },
      ],
    });
  }

  function removeCondition(idx: number) {
    onChange({
      ...draft,
      conditions: draft.conditions.filter((_, i) => i !== idx),
    });
  }

  function updateAction(idx: number, patch: Partial<FilterAction>) {
    const actions = draft.actions.map((a, i) =>
      i === idx ? { ...a, ...patch } : a
    );
    onChange({ ...draft, actions });
  }

  function addAction() {
    onChange({
      ...draft,
      actions: [...draft.actions, { type: "label", params: {} }],
    });
  }

  function removeAction(idx: number) {
    onChange({ ...draft, actions: draft.actions.filter((_, i) => i !== idx) });
  }

  return (
    <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="mb-3 grid gap-2">
        <label className="text-xs font-medium text-[var(--color-muted-fg)]">
          Rule name
        </label>
        <Input
          value={draft.name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Rule name"
          autoFocus
        />
      </div>

      <Separator className="my-3" />

      {/* Conditions */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
          If all of these match
        </span>
        <Button size="sm" variant="ghost" onClick={addCondition}>
          <Plus className="h-3.5 w-3.5" />
          Condition
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {draft.conditions.map((cond, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Select
              value={cond.field}
              onValueChange={(v) =>
                updateCondition(idx, { field: v as ConditionField })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {CONDITION_FIELD_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={cond.operator}
              onValueChange={(v) =>
                updateCondition(idx, { operator: v as ConditionOperator })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {CONDITION_OPERATOR_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={cond.value}
              onChange={(e) => updateCondition(idx, { value: e.target.value })}
              placeholder="value"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeCondition(idx)}
              aria-label="Remove condition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      {/* Actions */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
          Then do this
        </span>
        <Button size="sm" variant="ghost" onClick={addAction}>
          <Plus className="h-3.5 w-3.5" />
          Action
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {draft.actions.map((action, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Select
              value={action.type}
              onValueChange={(v) =>
                updateAction(idx, { type: v as ActionType, params: {} })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {ACTION_TYPE_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ActionParams
              action={action}
              onChange={(params) => updateAction(idx, { params })}
              labels={labels}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeAction(idx)}
              aria-label="Remove action"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      {/* Test */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={onTest}>
          <Play className="h-3.5 w-3.5" />
          Test rule
        </Button>
        {testResult !== null && (
          <span className="text-sm text-[var(--color-muted-fg)]">
            <Badge variant={testResult > 0 ? "success" : "secondary"}>
              {testResult}
            </Badge>{" "}
            matching email{testResult !== 1 ? "s" : ""} in the current view
          </span>
        )}
      </div>
    </div>
  );
}

function ActionParams({
  action,
  onChange,
  labels,
}: {
  action: FilterAction;
  onChange: (params: Record<string, string>) => void;
  labels: ReturnType<typeof useLabelStore.getState>["labels"];
}) {
  switch (action.type) {
    case "label":
      return (
        <Select
          value={action.params.labelId ?? ""}
          onValueChange={(v) => onChange({ labelId: v })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select label" />
          </SelectTrigger>
          <SelectContent>
            {labels.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "move":
      return (
        <Select
          value={action.params.folder ?? ""}
          onValueChange={(v) => onChange({ folder: v })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select folder" />
          </SelectTrigger>
          <SelectContent>
            {FOLDERS.map((f) => (
              <SelectItem key={f} value={f} className="capitalize">
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "forward":
      return (
        <Input
          value={action.params.address ?? ""}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="forward to address"
          className="flex-1"
        />
      );
    default:
      return (
        <span className="flex-1 text-xs text-[var(--color-muted-fg)]">
          No parameters
        </span>
      );
  }
}
