"use client";

/**
 * Label Manager — modal panel for CRUD on labels.
 */
import * as React from "react";
import { LabelTreeRow } from "./label-manager/label-tree-row";
import { Plus, Check } from "lucide-react";
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
import { useLabelStore, buildLabelTree } from "@/stores/label-store";
import type { Label } from "@/types/label";
import {
  formReducer,
  initialFormState,
} from "./parts/label-manager/form-reducer";
import { ColorPicker, IconPicker } from "./parts/label-manager/pickers";

interface LabelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabelManager({ open, onOpenChange }: LabelManagerProps) {
  const labels = useLabelStore((s) => s.labels);
  const tree = React.useMemo(() => buildLabelTree(labels), [labels]);
  const createLabel = useLabelStore((s) => s.createLabel);
  const updateLabel = useLabelStore((s) => s.updateLabel);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const reorderLabel = useLabelStore((s) => s.reorderLabel);

  const [formState, dispatch] = React.useReducer(formReducer, initialFormState);
  const {
    editingId,
    isCreating,
    name,
    color,
    customColor,
    icon,
    parentId,
    description,
  } = formState;

  const activeColor = customColor || color;

  const resetForm = () => dispatch({ type: "reset" });
  const startCreate = () => dispatch({ type: "startCreate" });
  const startEdit = (label: Label) => dispatch({ type: "startEdit", label });

  function handleSave() {
    if (!name.trim()) return;
    const payload = {
      name,
      color: activeColor,
      icon,
      parentId: parentId === "__none__" ? null : parentId,
      description: description.trim() || undefined,
    };
    if (editingId) updateLabel(editingId, payload);
    else createLabel(payload);
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
            <Button size="sm" variant="outline" onClick={startCreate} disabled={showForm}>
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
                    onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
                    placeholder="Label name"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                      Parent label
                    </label>
                    <Select value={parentId} onValueChange={(v) => dispatch({ type: "setParentId", parentId: v })}>
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
                    <IconPicker value={icon} onChange={(v) => dispatch({ type: "setIcon", icon: v })} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                    Color
                  </label>
                  <ColorPicker
                    value={color}
                    customValue={customColor}
                    onPresetChange={(c) => dispatch({ type: "setColor", color: c })}
                    onCustomChange={(c) => dispatch({ type: "setCustomColor", customColor: c })}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => dispatch({ type: "setDescription", description: e.target.value })}
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
