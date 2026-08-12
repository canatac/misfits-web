"use client";

/**
 * Attachment zone — drag & drop file upload, file list with type icons,
 * size, remove button, image preview thumbnails, upload progress, and
 * file size/type validation.
 */
import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Archive as ArchiveIcon,
  Music,
  Video,
  File as FileIcon,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Attachment } from "@/types/composer";
import { uid } from "@/stores/composer-store";

interface AttachmentZoneProps {
  attachments: Attachment[];
  onAdd: (attachment: Attachment) => void;
  onUpdate: (id: string, patch: Partial<Attachment>) => void;
  onRemove: (id: string) => void;
  className?: string;
}

/** Max total attachment size (25 MB). */
const MAX_FILE_SIZE = 25 * 1024 * 1024;
/** Allowed MIME type prefixes. */
const ALLOWED_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-tar",
  "application/x-7z-compressed",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "audio/",
  "video/",
];

function isAllowed(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) return false;
  return ALLOWED_PREFIXES.some((p) => file.type.startsWith(p));
}

function fileIcon(contentType: string): typeof FileIcon {
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf") return FileText;
  if (contentType.startsWith("audio/")) return Music;
  if (contentType.startsWith("video/")) return Video;
  if (
    contentType.includes("spreadsheet") ||
    contentType.includes("excel") ||
    contentType === "text/csv"
  )
    return FileSpreadsheet;
  if (
    contentType.includes("presentation") ||
    contentType.includes("powerpoint")
  )
    return Presentation;
  if (
    contentType.includes("zip") ||
    contentType.includes("compressed") ||
    contentType.includes("tar") ||
    contentType.includes("gzip")
  )
    return ArchiveIcon;
  if (contentType.startsWith("text/") || contentType === "application/json")
    return FileText;
  return FileIcon;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Simulate an upload with progress. */
function simulateUpload(
  attachment: Attachment,
  onUpdate: (id: string, patch: Partial<Attachment>) => void
) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 25 + 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      onUpdate(attachment.id, { progress: 100, status: "done" });
    } else {
      onUpdate(attachment.id, {
        progress: Math.round(progress),
        status: "uploading",
      });
    }
  }, 250);
}

export function AttachmentZone({
  attachments,
  onAdd,
  onUpdate,
  onRemove,
  className,
}: AttachmentZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files);
      for (const file of list) {
        if (!isAllowed(file)) {
          setError(
            `"${file.name}" was skipped — unsupported type or exceeds ${formatSize(MAX_FILE_SIZE)}.`
          );
          continue;
        }
        const isImage = file.type.startsWith("image/");
        const attachment: Attachment = {
          id: uid("att"),
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: "pending",
          file,
        };
        onAdd(attachment);
        simulateUpload(attachment, onUpdate);
      }
    },
    [onAdd, onUpdate]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const Icon = fileIcon;

  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-testid="attachment-zone"
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-6 text-sm transition-colors",
          isDragging
            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/5 text-[var(--color-brand-500)]"
            : "border-[var(--color-border)] text-[var(--color-muted-fg)] hover:border-[var(--color-brand-500)]/50 hover:bg-[var(--color-muted)]"
        )}
      >
        <Upload className="h-5 w-5" />
        <span>
          <span className="font-medium text-[var(--color-fg)]">
            Click to upload
          </span>{" "}
          or drag and drop
        </span>
        <span className="text-xs text-[var(--color-muted-fg)]">
          (max {formatSize(MAX_FILE_SIZE)} per file)
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)]/30 bg-[var(--color-danger-500)]/10 px-3 py-2 text-sm text-[var(--color-danger-500)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          {attachments.map((att) => {
            const AttIcon = Icon(att.contentType);
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-2.5"
                data-testid="attachment-item"
              >
                {att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.filename}
                    className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-muted)]">
                    <AttIcon className="h-5 w-5 text-[var(--color-muted-fg)]" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-[var(--color-fg)]">
                      {att.filename}
                    </span>
                    {att.status === "error" && (
                      <span className="text-xs text-[var(--color-danger-500)]">
                        failed
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    {formatSize(att.size)}
                  </span>
                  {(att.status === "uploading" || att.status === "pending") && (
                    <Progress value={att.progress} className="h-1" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onRemove(att.id)}
                  aria-label={`Remove ${att.filename}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
