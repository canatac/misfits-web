"use client";

import * as React from "react";
import { Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CONDITION_FIELD_LABELS,
  CONDITION_OPERATOR_LABELS,
  ACTION_TYPE_LABELS,
} from "@/stores/filter-store";
import { useLabelStore } from "@/stores/label-store";
import type {
  Filter,
  FilterCondition,
  FilterAction,
  ConditionField,
  ConditionOperator,
  ActionType,
} from "@/types/label";
import { ActionParams } from "./action-params";

const FIELDS = Object.keys(CONDITION_FIELD_LABELS) as ConditionField[];
const OPERATORS = Object.keys(CONDITION_OPERATOR_LABELS) as ConditionOperator[];
const ACTION_TYPES = Object.keys(ACTION_TYPE_LABELS) as ActionType[];

export function RuleForm({
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
    onChange({
      ...draft,
      conditions: draft.conditions.map((c, i) =>
        i === idx ? { ...c, ...patch } : c,
      ),
    });
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
    onChange({
      ...draft,
      actions: draft.actions.map((a, i) =>
        i === idx ? { ...a, ...patch } : a,
      ),
    });
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
