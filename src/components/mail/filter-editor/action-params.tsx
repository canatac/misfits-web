"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useLabelStore } from "@/stores/label-store";
import type { FilterAction } from "@/types/label";
import type { Folder } from "@/types/email";

const FOLDERS: Folder[] = [
  "inbox",
  "sent",
  "drafts",
  "archive",
  "trash",
  "spam",
];

export function ActionParams({
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
