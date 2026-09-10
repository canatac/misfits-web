"use client";

/**
 * Email View — displays a single email with sanitized HTML body,
 * blocked external images (toggle to load), attachment list, action buttons,
 * and collapsible quoted replies. Plaintext fallback for multipart/alternative.
 */
import { useState, useMemo } from "react";
import { useEmailBodyHydration } from "./hooks/useEmailBodyHydration";
import {
  Paperclip,
  ImageOff,
  ChevronDown,
  MailOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailSenderHeader } from "./email-sender-header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";
import { LabelManager } from "@/components/mail/label-manager";
import { SecurityBanner } from "@/components/mail/security-banner";
import { AttachmentCard } from "./attachment-card";
import { useEmailActions } from "@/hooks/useEmailActions";
import { useEmailBody } from "./hooks/useEmailBody";
import { EmailToolbar } from "./email-view/email-toolbar";
import { EmailLabelsBar } from "./email-view/email-labels-bar";

interface EmailViewProps {
  className?: string;
}

export function EmailView({ className }: EmailViewProps) {
  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);

  const labels = useLabelStore((s) => s.labels);
  const assignments = useLabelStore((s) => s.assignments);
  const assignLabelToEmail = useLabelStore((s) => s.assignLabelToEmail);
  const removeLabelFromEmail = useLabelStore((s) => s.removeLabelFromEmail);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const email = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) ?? null,
    [emails, selectedEmailId]
  );

  useEmailBodyHydration(email);

  const emailLabelIds = useMemo(() => {
    if (!email) return [];
    return Array.from(
      new Set([...email.labels, ...(assignments[email.id] ?? [])])
    );
  }, [email, assignments]);

  const {
    loadImages,
    setLoadImages,
    showQuoted,
    setShowQuoted,
    hasQuoted,
    processedBody,
  } = useEmailBody(email);

  const {
    handleReply,
    handleReplyAll,
    handleForward,
    handleToggleStar,
    handleArchive,
    handleDelete,
    handleMarkUnread,
    handleHermesSummarize,
    handleHermesReplyDraft,
    handleHermesTranslate,
    handleHermesTodos,
  } = useEmailActions(email);

  if (!email) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-[var(--color-bg)]",
          className
        )}
        data-testid="email-view-empty"
      >
        <EmptyState
          icon={MailOpen}
          title="No email selected"
          description="Select an email from the list to read it here."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[#0A0A0B] text-[#E0E0E0]",
        className
      )}
      data-testid="email-view"
    >
      <EmailToolbar
        isStarred={email.isStarred}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onMarkUnread={handleMarkUnread}
        onReply={handleReply}
        onReplyAll={handleReplyAll}
        onForward={handleForward}
        onToggleStar={handleToggleStar}
        onHermesSummarize={handleHermesSummarize}
        onHermesReplyDraft={handleHermesReplyDraft}
        onHermesTranslate={handleHermesTranslate}
        onHermesTodos={handleHermesTodos}
      />

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-6">
          <EmailLabelsBar
            emailId={email.id}
            subject={email.subject}
            emailLabelIds={emailLabelIds}
            labels={labels}
            onAssign={assignLabelToEmail}
            onRemove={removeLabelFromEmail}
            onOpenManager={() => setLabelManagerOpen(true)}
          />

          <EmailSenderHeader email={email} />

          <Separator className="mb-4" />

          <SecurityBanner
            result={{
              emailId: email.id,
              threatLevel: "safe",
              score: 0,
              reasons: [],
              indicators: [],
              suspiciousLinks: [],
              headers: {
                spf: "none",
                dkim: "none",
                dmarc: "none",
                details: [],
              },
              scannedAt: new Date().toISOString(),
              aiAssisted: false,
            }}
            emailId={email.id}
          />

          {!loadImages && email.bodyType === "html" && (
            <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2">
              <ImageOff className="h-4 w-4 text-[var(--color-muted-fg)]" />
              <span className="text-sm text-[var(--color-muted-fg)]">
                Images are blocked for privacy
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setLoadImages(true)}
                className="ml-auto"
              >
                Load images
              </Button>
            </div>
          )}

          <div
            className="prose-mail text-[var(--color-fg)]"
            // biome-ignore lint: HTML is sanitized via DOMPurify above
            dangerouslySetInnerHTML={{ __html: processedBody }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains("quoted-collapsed")) {
                setShowQuoted(true);
              }
              if (target.tagName === "A") {
                e.preventDefault();
                const href = target.getAttribute("href");
                if (href && href.startsWith("http")) {
                  window.open(href, "_blank", "noopener,noreferrer");
                }
              }
            }}
            data-testid="email-body"
          />

          {hasQuoted && !showQuoted && (
            <button
              onClick={() => setShowQuoted(true)}
              className="mt-4 flex items-center gap-1 text-sm text-[var(--color-brand-500)] hover:underline"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show quoted text
            </button>
          )}
          {hasQuoted && showQuoted && (
            <button
              onClick={() => setShowQuoted(false)}
              className="mt-4 flex items-center gap-1 text-sm text-[var(--color-brand-500)] hover:underline"
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
              Hide quoted text
            </button>
          )}

          {email.attachments.length > 0 && (
            <div className="mt-6" data-testid="email-attachments">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-fg)]">
                <Paperclip className="h-4 w-4" />
                {email.attachments.length}{" "}
                {email.attachments.length === 1 ? "Attachment" : "Attachments"}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {email.attachments.map((att) => (
                  <AttachmentCard key={att.id} attachment={att} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <LabelManager
        open={labelManagerOpen}
        onOpenChange={setLabelManagerOpen}
      />
    </div>
  );
}
