"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabelTree } from "@/types/label";

export function LabelTreeNode({
  node,
  depth,
  onFilter,
}: {
  node: LabelTree;
  depth: number;
  onFilter: (name: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex h-4 w-4 items-center justify-center text-[var(--color-muted-fg)]"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !expanded && "-rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="h-4 w-4" />
        )}
        <button
          type="button"
          onClick={() => onFilter(node.name)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: node.color }}
            aria-hidden="true"
          />
          <span className="flex-1">{node.name}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <LabelTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onFilter={onFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
