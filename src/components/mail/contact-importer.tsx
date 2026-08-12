"use client";

/**
 * Contact importer modal (Issue #152).
 *
 * Accepts pasted text or an uploaded CSV / vCard file, parses it into a
 * preview list, and imports the non-duplicate entries on confirm. Supports
 * both vCard (.vcf) and CSV (header row) formats.
 */
import { useState, useCallback, type ChangeEvent } from "react";
import { Upload, ClipboardPaste, FileUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { parseVCard, parseCSV } from "@/stores/contact-store";
import { useContactMutations } from "@/hooks/use-contacts";
import type { ContactImport } from "@/types/contact";
import { toast } from "sonner";

interface ContactImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "paste" | "upload";

/** Detect whether raw text looks like vCard or CSV. */
function detectFormat(text: string): "vcard" | "csv" {
  return /BEGIN:VCARD/i.test(text) ? "vcard" : "csv";
}

export function ContactImporter({ open, onOpenChange }: ContactImporterProps) {
  const { importContacts } = useContactMutations();
  const [mode, setMode] = useState<Mode>("paste");
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ContactImport[]>([]);
  const [fileName, setFileName] = useState("");

  const parse = useCallback((text: string) => {
    if (!text.trim()) {
      setParsed([]);
      return;
    }
    const fmt = detectFormat(text);
    setParsed(fmt === "vcard" ? parseVCard(text) : parseCSV(text));
  }, []);

  const handleFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      file
        .text()
        .then((text) => {
          setRaw(text);
          parse(text);
        })
        .catch(() => toast.error("Could not read file"));
    },
    [parse]
  );

  const handlePaste = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setRaw(text);
      parse(text);
    },
    [parse]
  );

  const reset = () => {
    setRaw("");
    setParsed([]);
    setFileName("");
    setMode("paste");
  };

  const handleImport = async () => {
    const valid = parsed.filter((p) => p.email || p.name);
    if (valid.length === 0) {
      toast.error("No valid contacts found");
      return;
    }
    try {
      const added = await importContacts.mutateAsync(valid);
      toast.success(`Imported ${added} contact${added === 1 ? "" : "s"}`);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Import failed");
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setParsed([]);
    setRaw("");
    setFileName("");
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl" data-testid="contact-importer">
        <ModalHeader>
          <ModalTitle>Import contacts</ModalTitle>
          <ModalDescription>
            Paste contacts or upload a CSV / vCard file. Duplicates by email are
            skipped.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <div className="mb-3 flex gap-2">
            <Button
              size="sm"
              variant={mode === "paste" ? "default" : "outline"}
              onClick={() => switchMode("paste")}
              className="gap-1.5"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste
            </Button>
            <Button
              size="sm"
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => switchMode("upload")}
              className="gap-1.5"
            >
              <FileUp className="h-3.5 w-3.5" />
              Upload file
            </Button>
          </div>

          {mode === "paste" ? (
            <Textarea
              value={raw}
              onChange={handlePaste}
              placeholder={
                "Paste vCard or CSV here…\n\nBEGIN:VCARD\nVERSION:3.0\nFN:…\nEMAIL:…\nEND:VCARD"
              }
              className="min-h-[160px] font-mono text-xs"
              aria-label="Paste contacts"
            />
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 p-8 text-center">
              <Upload className="h-6 w-6 text-[var(--color-muted-fg)]" />
              <span className="text-sm text-[var(--color-fg)]">
                {fileName ? fileName : "Click to choose a .csv or .vcf file"}
              </span>
              <Input
                type="file"
                accept=".csv,.vcf,.txt,text/csv,text/vcard"
                onChange={handleFile}
                className="hidden"
                aria-label="Upload contacts file"
              />
            </label>
          )}

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                <Check className="h-3 w-3" />
                Preview · {parsed.length} contact
                {parsed.length === 1 ? "" : "s"}
              </div>
              <ScrollArea className="max-h-48 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                <ul className="divide-y divide-[var(--color-border)]">
                  {parsed.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 text-sm">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-[var(--color-fg)]">
                          {p.name || p.email || "(no name)"}
                        </span>
                        <span className="truncate text-xs text-[var(--color-muted-fg)]">
                          {p.email || "—"}
                        </span>
                      </span>
                      {p.company && (
                        <Badge variant="outline" className="shrink-0">
                          {p.company}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {raw.trim() && parsed.length === 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-warning-500)]">
              <X className="h-4 w-4" />
              No valid contacts detected in the input.
            </p>
          )}
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsed.length === 0}
            loading={importContacts.isPending}
          >
            Import{" "}
            {parsed.length > 0
              ? `${parsed.length} contact${parsed.length === 1 ? "" : "s"}`
              : ""}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
