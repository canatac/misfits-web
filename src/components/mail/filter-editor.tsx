"use client";

/**
 * Filter Editor — visual no-code rule builder (IF [conditions] THEN [actions]).
 * Add/remove conditions & actions, enable/disable toggle, test rule, import/export.
 */
import * as React from "react";
import {
  Plus,
  Save,
  X,
  Upload,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalBody,
} from "@/components/ui/modal";
import { RuleForm } from "./filter-editor/rule-form";
import { RulesList } from "./filter-editor/rules-list";
import { useFilterEditor } from "./filter-editor/use-filter-editor";

interface FilterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterEditor({ open, onOpenChange }: FilterEditorProps) {
  const {
    rules,
    deleteRule,
    toggleRule,
    editingId,
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
    showForm,
  } = useFilterEditor();

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
            <RulesList
              rules={rules}
              onToggle={toggleRule}
              onEdit={startEdit}
              onDelete={deleteRule}
            />
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
