"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Label, LabelTree } from "@/types/label";

function getIcon(
  name: string
): React.ComponentType<{ className?: string }> | undefined {
  if (!name) return undefined;
  const pascal = name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  const icons = Icons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  return icons[pascal];
}

export function LabelTreeRow({
  node,
  depth,
  editingId,
  onEdit,
  onDelete,
  onReorder,
}: {
  node: LabelTree;
  depth: number;
  editingId: string | null;
  onEdit: (l: Label) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const Icon = getIcon(node.icon);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)] py-1.5 pr-2",
          editingId === node.id && "bg-[var(--color-muted)]"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-[var(--color-muted-fg)]",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-90"
            )}
          />
        </button>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: node.color }}
          aria-hidden="true"
        />
        {Icon && <Icon className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />}
        <span className="flex-1 truncate text-sm">{node.name}</span>
        <div
          className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 hover:opacity-100"
          style={{ opacity: 1 }}
        >
          <button
            type="button"
            aria-label="Move up"
            onClick={() => onReorder(node.id, "up")}
            className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            onClick={() => onReorder(node.id, "down")}
            className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Edit label"
            onClick={() => onEdit(node)}
            className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete label"
            onClick={() => onDelete(node.id)}
            className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] hover:text-[var(--color-danger-500)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <LabelTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              editingId={editingId}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
