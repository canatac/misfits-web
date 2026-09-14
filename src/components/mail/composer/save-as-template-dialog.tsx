"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTemplate } from "@/stores/email-template-helpers";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  subject,
  body,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0;

  const handleSave = () => {
    if (!isValid) return;
    setSaving(true);
    try {
      createTemplate({ name: trimmedName, subject, body });
      toast.success(`Template "${trimmedName}" saved.`);
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setName("");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-md" data-testid="save-as-template-dialog">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#C49B66]" />
            Save as template
          </ModalTitle>
          <ModalDescription>
            Save the current subject and body as a reusable template.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Follow-up, Meeting request…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              disabled={saving}
              autoFocus
              data-testid="template-name-input"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={saving}
            data-testid="template-cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            loading={saving}
            data-testid="template-save-button"
          >
            Save template
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
