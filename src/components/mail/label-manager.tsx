"use client";

/**
 * Label Manager — modal panel for CRUD on labels.
 * Color picker (preset + custom), icon picker (lucide), hierarchical tree
 * with expand/collapse and up/down reorder buttons.
 */
import * as React from "react";
import * as Icons from "lucide-react";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useLabelStore,
  LABEL_COLORS,
  LABEL_ICONS,
  buildLabelTree,
} from "@/stores/label-store";
import type { Label, LabelCreateInput, LabelTree } from "@/types/label";

interface LabelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function LabelManager({ open, onOpenChange }: LabelManagerProps) {
  const labels = useLabelStore((s) => s.labels);
  // Stable when `labels` unchanged — calling getLabelTree() in the selector
  // returns a fresh array every time and trips React max-update-depth (#185).
  const tree = React.useMemo(() => buildLabelTree(labels), [labels]);
  const createLabel = useLabelStore((s) => s.createLabel);
  const updateLabel = useLabelStore((s) => s.updateLabel);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const reorderLabel = useLabelStore((s) => s.reorderLabel);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(LABEL_COLORS[0]);
  const [customColor, setCustomColor] = React.useState("");
  const [icon, setIcon] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("__none__");
  const [description, setDescription] = React.useState("");

  const activeColor = customColor || color;

  function resetForm() {
    setName("");
    setColor(LABEL_COLORS[0]);
    setCustomColor("");
    setIcon("");
    setParentId("__none__");
    setDescription("");
    setEditingId(null);
    setIsCreating(false);
  }

  function startCreate() {
    resetForm();
    setIsCreating(true);
  }

  function startEdit(label: Label) {
    setName(label.name);
    setColor(label.color);
    setCustomColor("");
    setIcon(label.icon);
    setParentId(label.parentId ?? "__none__");
    setDescription(label.description ?? "");
    setEditingId(label.id);
    setIsCreating(false);
  }

  function handleSave() {
    if (!name.trim()) return;
    if (editingId) {
      updateLabel(editingId, {
        name,
        color: activeColor,
        icon,
        parentId: parentId === "__none__" ? null : parentId,
        description: description.trim() || undefined,
      });
    } else {
      createLabel({
        name,
        color: activeColor,
        icon,
        parentId: parentId === "__none__" ? null : parentId,
        description: description.trim() || undefined,
      });
    }
    resetForm();
  }

  function handleDelete(id: string) {
    deleteLabel(id);
    if (editingId === id) resetForm();
  }

  const editingLabel = editingId
    ? labels.find((l) => l.id === editingId)
    : null;
  const showForm = isCreating || !!editingLabel;

  // Parent candidates exclude the editing label and its descendants.
  const parentCandidates = React.useMemo(() => {
    if (!editingId) return labels;
    const desc = new Set<string>([editingId]);
    let added = true;
    while (added) {
      added = false;
      for (const l of labels) {
        if (l.parentId && desc.has(l.parentId) && !desc.has(l.id)) {
          desc.add(l.id);
          added = true;
        }
      }
    }
    return labels.filter((l) => !desc.has(l.id));
  }, [labels, editingId]);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Manage labels</ModalTitle>
          <ModalDescription>
            Create, edit, and organize labels. Labels can be nested for finer
            grouping.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Labels</span>
            <Button
              size="sm"
              variant="outline"
              onClick={startCreate}
              disabled={showForm}
            >
              <Plus className="h-4 w-4" />
              New label
            </Button>
          </div>

          {showForm && (
            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ backgroundColor: activeColor }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">
                  {editingId ? "Edit label" : "New label"}
                </span>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Label name"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                      Parent label
                    </label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="No parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No parent</SelectItem>
                        {parentCandidates.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                      Icon
                    </label>
                    <IconPicker value={icon} onChange={setIcon} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                    Color
                  </label>
                  <ColorPicker
                    value={color}
                    customValue={customColor}
                    onPresetChange={(c) => {
                      setColor(c);
                      setCustomColor("");
                    }}
                    onCustomChange={(c) => setCustomColor(c)}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this label for?"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
                  <Check className="h-4 w-4" />
                  {editingId ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-3 max-h-64 overflow-auto">
            {tree.length === 0 && !showForm && (
              <p className="py-6 text-center text-sm text-[var(--color-muted-fg)]">
                No labels yet. Click “New label” to create one.
              </p>
            )}
            {tree.map((node) => (
              <LabelTreeRow
                key={node.id}
                node={node}
                depth={0}
                editingId={editingId}
                onEdit={startEdit}
                onDelete={handleDelete}
                onReorder={reorderLabel}
              />
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tree row                                                           */
/* ------------------------------------------------------------------ */

function LabelTreeRow({
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

/* ------------------------------------------------------------------ */
/* Color & icon pickers                                               */
/* ------------------------------------------------------------------ */

function ColorPicker({
  value,
  customValue,
  onPresetChange,
  onCustomChange,
}: {
  value: string;
  customValue: string;
  onPresetChange: (color: string) => void;
  onCustomChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {LABEL_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onPresetChange(c)}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform",
            !customValue && value === c
              ? "scale-110 border-[var(--color-fg)]"
              : "border-transparent hover:scale-110"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="relative ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)]">
        <input
          type="color"
          value={customValue || value}
          onChange={(e) => onCustomChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Custom color"
        />
        <Icons.Palette className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
      </label>
    </div>
  );
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="No icon" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No icon</SelectItem>
        {LABEL_ICONS.map((name) => {
          const Icon = getIcon(name);
          return (
            <SelectItem key={name} value={name}>
              <span className="flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
