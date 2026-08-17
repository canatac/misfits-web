"use client";

import { Tag, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TagsEditor({
  tags,
  tagInput,
  setTagInput,
  onAdd,
  onRemove,
}: {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        <Tag className="h-3 w-3" />
        Tags
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.length === 0 && (
          <span className="text-xs text-[var(--color-muted-fg)]">
            No tags yet.
          </span>
        )}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1 pl-2">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="rounded-full p-0.5 hover:bg-[var(--color-danger-500)]/15 hover:text-[var(--color-danger-500)]"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Add tag…"
          className="h-8 text-xs"
          aria-label="Add tag"
        />
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={onAdd}
          aria-label="Add tag"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
