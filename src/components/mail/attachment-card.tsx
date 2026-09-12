/**
 * AttachmentCard — extracted from email-view (Sprint 13).
 * Clickable image attachments open the inline preview lightbox.
 */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { File as FileIcon } from "lucide-react";
import type { EmailAttachment } from "@/types/email";
import { ATTACHMENT_ICONS, formatFileSize } from "./email-view-utils";

export function AttachmentCard({
  attachment,
  onPreview,
}: {
  attachment: EmailAttachment;
  onPreview?: () => void;
}) {
  const Icon = ATTACHMENT_ICONS[attachment.type] ?? FileIcon;
  const isPreviewable = attachment.contentType?.startsWith("image/") && onPreview;
  return (
    <button
      type="button"
      onClick={() => {
        if (isPreviewable) {
          onPreview();
        }
      }}
      className={cn(
        "flex w-full cursor-default items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition-colors hover:bg-[var(--color-muted)]",
        isPreviewable && "cursor-pointer"
      )}
      disabled={!isPreviewable}
      aria-label={isPreviewable ? `Preview ${attachment.filename}` : attachment.filename}
      data-testid="attachment-card"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-muted)]">
        <Icon className="h-5 w-5 text-[var(--color-muted-fg)]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-[var(--color-fg)]">
          {attachment.filename}
        </span>
        <span className="text-xs text-[var(--color-muted-fg)]">
          {formatFileSize(attachment.size)} · {attachment.type.toUpperCase()}
        </span>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <a
          href={attachment.downloadUrl ?? "#"}
          download={attachment.filename}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download ${attachment.filename}`}
        >
          Download
        </a>
      </Button>
    </button>
  );
}
