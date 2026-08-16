"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Filter } from "@/types/label";

export function RulesList({
  rules,
  onToggle,
  onEdit,
  onDelete,
}: {
  rules: Filter[];
  onToggle: (id: string) => void;
  onEdit: (rule: Filter) => void;
  onDelete: (id: string) => void;
}) {
  return (
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
              onCheckedChange={() => onToggle(rule.id)}
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
              onClick={() => onEdit(rule)}
              aria-label="Edit rule"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(rule.id)}
              aria-label="Delete rule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
    </div>
  );
}
