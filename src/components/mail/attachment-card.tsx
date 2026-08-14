/**
 * AttachmentCard — extracted from email-view (Sprint 13).
 */
import { Button } from "@/components/ui/button";
import { File as FileIcon } from "lucide-react";
import type { EmailAttachment } from "@/types/email";
import { ATTACHMENT_ICONS, formatFileSize } from "./email-view-utils";

export function AttachmentCard({ attachment }: { attachment: EmailAttachment }) {
  const Icon = ATTACHMENT_ICONS[attachment.type] ?? FileIcon;
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition-colors hover:bg-[var(--color-muted)]">
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
          aria-label={`Download ${attachment.filename}`}
        >
          Download
        </a>
      </Button>
    </div>
  );
}
