"use client";

/**
 * Email View — displays a single email with sanitized HTML body,
 * blocked external images (toggle to load), attachment list, action buttons,
 * and collapsible quoted replies. Plaintext fallback for multipart/alternative.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import DOMPurify from "dompurify";
import {
  Star,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Archive as ArchiveIcon,
  Music,
  Video,
  File as FileIcon,
  ImageOff,
  ChevronDown,
  MailOpen,
  Tag,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEmailStore } from "@/stores/email-store";
import { useComposerStore, uid } from "@/stores/composer-store";
import { useLabelStore } from "@/stores/label-store";
import { LabelBadge } from "@/components/mail/label-badge";
import { LabelManager } from "@/components/mail/label-manager";
import type { Email, EmailAttachment, AttachmentType } from "@/types/email";
import type { Recipient } from "@/types/composer";

const ATTACHMENT_ICONS: Record<AttachmentType, typeof FileIcon> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: ArchiveIcon,
  audio: Music,
  video: Video,
  other: FileIcon,
};

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Regex to detect quoted reply sections
const QUOTE_PATTERNS = [
  /<blockquote[^>]*>[\s\S]*<\/blockquote>/i,
  /On .* wrote:[\s\S]*$/i,
  /Le .* a écrit :[\s\S]*$/i,
  /-+Original Message-+[\s\S]*$/i,
  /From: .[\s\S]*$/i,
];

interface EmailViewProps {
  className?: string;
}

export function EmailView({ className }: EmailViewProps) {
  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const toggleStar = useEmailStore((s) => s.toggleStar);
  const markUnread = useEmailStore((s) => s.markUnread);
  const archive = useEmailStore((s) => s.archive);
  const deleteEmail = useEmailStore((s) => s.deleteEmail);

  const labels = useLabelStore((s) => s.labels);
  const assignments = useLabelStore((s) => s.assignments);
  const assignLabelToEmail = useLabelStore((s) => s.assignLabelToEmail);
  const removeLabelFromEmail = useLabelStore((s) => s.removeLabelFromEmail);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const email = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) ?? null,
    [emails, selectedEmailId],
  );

  // Merge static email.labels with store assignments.
  const emailLabelIds = useMemo(() => {
    if (!email) return [];
    return Array.from(
      new Set([...email.labels, ...(assignments[email.id] ?? [])]),
    );
  }, [email, assignments]);

  const [loadImages, setLoadImages] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);
  const [hasQuoted, setHasQuoted] = useState(false);

  // Reset state when email changes
  useEffect(() => {
    setLoadImages(false);
    setShowQuoted(false);
    if (email) {
      setHasQuoted(QUOTE_PATTERNS.some((p) => p.test(email.body)));
    } else {
      setHasQuoted(false);
    }
  }, [email]);

  // Sanitize the HTML body with DOMPurify
  const sanitizedBody = useMemo(() => {
    if (!email) return "";
    if (email.bodyType === "text") {
      // Convert plaintext to HTML with line breaks
      const escaped = email.body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped.replace(/\n/g, "<br>");
    }
    return DOMPurify.sanitize(email.body, {
      ALLOWED_TAGS: [
        "p", "br", "div", "span", "a", "img", "ul", "ol", "li",
        "b", "strong", "i", "em", "u", "s", "del", "blockquote",
        "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6",
        "table", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "style", "class", "id", "target", "colspan", "rowspan"],
      ALLOW_DATA_ATTR: false,
    });
  }, [email]);

  // Process body: block external images and collapse quoted replies
  const processedBody = useMemo(() => {
    let body = sanitizedBody;
    if (!loadImages) {
      // Replace img src with data attribute to block loading
      body = body.replace(
        /<img([^>]*?)\ssrc=(["']?)(https?:\/\/[^"'\s>]+)(["']?)([^>]*)>/gi,
        (_match, pre: string, _q1: string, src: string, _q2: string, post: string) =>
          `<img${pre} data-blocked-src="${src}" alt="Image blocked" ${post}>`,
      );
    } else {
      // Restore blocked images
      body = body.replace(
        /<img([^>]*?)\sdata-blocked-src=(["']?)([^"'\s>]+)(["']?)([^>]*)>/gi,
        (_match, pre: string, _q1: string, src: string, _q2: string, post: string) =>
          `<img${pre} src="${src}" ${post}>`,
      );
    }

    // Collapse quoted replies
    if (hasQuoted && !showQuoted) {
      for (const pattern of QUOTE_PATTERNS) {
        if (pattern.test(body)) {
          body = body.replace(
            pattern,
            '<div class="quoted-collapsed" style="border:1px solid var(--color-border);border-radius:var(--radius-md);padding:0.5rem 1rem;color:var(--color-muted-fg);font-size:0.875rem;cursor:pointer;">... Show quoted text ...</div>',
          );
          break;
        }
      }
    }

    return body;
  }, [sanitizedBody, loadImages, showQuoted, hasQuoted]);

  const openComposer = useComposerStore((s) => s.openComposer);

  const toRecipient = useCallback(
    (address: string, name: string, type: Recipient["type"] = "to"): Recipient => ({
      id: uid("rcpt"),
      email: address.toLowerCase(),
      name: name && name !== "me" ? name : undefined,
      type,
    }),
    [],
  );

  const buildReplyBody = useCallback((em: Email) => {
    const replyDate = new Date(em.date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `<p></p><blockquote>On ${replyDate}, ${em.from.name} &lt;${em.from.address}&gt; wrote:<br/>${em.body}</blockquote>`;
  }, []);

  const handleReply = useCallback(() => {
    if (!email) return;
    openComposer({
      to: [toRecipient(email.from.address, email.from.name)],
      cc: (email.cc ?? []).map((a) => toRecipient(a.address, a.name, "cc")),
      subject: email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`,
      body: buildReplyBody(email),
      inReplyTo: email.messageId,
      references: [...(email.references ?? []), email.messageId].filter(Boolean),
    });
  }, [email, openComposer, toRecipient, buildReplyBody]);

  const handleReplyAll = useCallback(() => {
    if (!email) return;
    const to: Recipient[] = [toRecipient(email.from.address, email.from.name)];
    for (const a of email.to) {
      if (a.address !== email.from.address && !to.some((r) => r.email === a.address.toLowerCase())) {
        to.push(toRecipient(a.address, a.name));
      }
    }
    const ccRecipients: Recipient[] = (email.cc ?? []).map((a) =>
      toRecipient(a.address, a.name, "cc"),
    );
    openComposer({
      to,
      cc: ccRecipients,
      subject: email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`,
      body: buildReplyBody(email),
      inReplyTo: email.messageId,
      references: [...(email.references ?? []), email.messageId].filter(Boolean),
    });
  }, [email, openComposer, toRecipient, buildReplyBody]);

  const handleForward = useCallback(() => {
    if (!email) return;
    const fwdBody = `<p></p><blockquote>---------- Forwarded message ----------<br/>From: ${email.from.name} &lt;${email.from.address}&gt;<br/>Date: ${new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br/>Subject: ${email.subject}<br/><br/>${email.body}</blockquote>`;
    openComposer({
      to: [],
      subject: email.subject.startsWith("Fwd: ") ? email.subject : `Fwd: ${email.subject}`,
      body: fwdBody,
    });
  }, [email, openComposer]);

  const handleToggleStar = useCallback(() => {
    if (email) toggleStar(email.id);
  }, [email, toggleStar]);

  const handleArchive = useCallback(() => {
    if (email) archive(email.id);
  }, [email, archive]);

  const handleDelete = useCallback(() => {
    if (email) deleteEmail(email.id);
  }, [email, deleteEmail]);

  const handleMarkUnread = useCallback(() => {
    if (email) markUnread(email.id);
  }, [email, markUnread]);

  if (!email) {
    return (
      <div
        className={cn("flex h-full items-center justify-center bg-[var(--color-bg)]", className)}
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
        "flex h-full flex-col bg-[var(--color-bg)]",
        className,
      )}
      data-testid="email-view"
    >
      {/* Action toolbar */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <Button variant="ghost" size="icon" onClick={handleArchive} aria-label="Archive">
          <Archive className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMarkUnread}
          aria-label="Mark as unread"
        >
          <MailOpen className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        <Button variant="ghost" size="sm" onClick={handleReply} className="gap-1.5">
          <Reply className="h-4 w-4" />
          Reply
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReplyAll} className="gap-1.5">
          <ReplyAll className="h-4 w-4" />
          Reply All
        </Button>
        <Button variant="ghost" size="sm" onClick={handleForward} className="gap-1.5">
          <Forward className="h-4 w-4" />
          Forward
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleStar}
          aria-label={email.isStarred ? "Unstar" : "Star"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              email.isStarred
                ? "fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                : "",
            )}
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMarkUnread}>
              <MailOpen className="mr-2 h-4 w-4" />
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-[var(--color-danger-500)]">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-6">
          {/* Subject + labels */}
          <div className="mb-4 flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-[var(--color-fg)]">
              {email.subject}
            </h1>
            {emailLabelIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {emailLabelIds.map((labelId) => (
                  <LabelBadge
                    key={labelId}
                    label={labelId}
                    size="md"
                    onRemove={() => removeLabelFromEmail(email.id, labelId)}
                  />
                ))}
              </div>
            )}
            {/* Add label dropdown */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Add label
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Assign a label</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {labels.length === 0 && (
                    <DropdownMenuItem disabled>No labels available</DropdownMenuItem>
                  )}
                  {labels.map((label) => {
                    const alreadyAssigned = emailLabelIds.includes(label.id);
                    return (
                      <DropdownMenuItem
                        key={label.id}
                        disabled={alreadyAssigned}
                        onClick={() => assignLabelToEmail(email.id, label.id)}
                        className="gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                          aria-hidden="true"
                        />
                        <span className="flex-1">{label.name}</span>
                        {alreadyAssigned && <ChevronDown className="h-3 w-3 rotate-[-90deg]" />}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLabelManagerOpen(true)} className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Manage labels
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sender header */}
          <div className="mb-4 flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(email.from.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-[var(--color-fg)]">
                  {email.from.name}
                </span>
                <span className="text-sm text-[var(--color-muted-fg)]">
                  &lt;{email.from.address}&gt;
                </span>
              </div>
              <div className="text-sm text-[var(--color-muted-fg)]">
                to{" "}
                {email.to.map((r, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    {r.name}
                  </span>
                ))}
                {email.cc && email.cc.length > 0 && (
                  <>
                    {" · cc "}
                    {email.cc.map((r, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {r.name}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
            <span className="shrink-0 text-sm text-[var(--color-muted-fg)]">
              {formatFullDate(email.date)}
            </span>
          </div>

          <Separator className="mb-4" />

          {/* Image blocking toggle */}
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

          {/* Email body */}
          <div
            className="prose-mail text-[var(--color-fg)]"
            // biome-ignore lint: HTML is sanitized via DOMPurify above
            dangerouslySetInnerHTML={{ __html: processedBody }}
            onClick={(e) => {
              // Handle "show quoted text" click
              const target = e.target as HTMLElement;
              if (target.classList.contains("quoted-collapsed")) {
                setShowQuoted(true);
              }
              // Open links in new tab
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

          {/* Quoted reply toggle */}
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

          {/* Attachments */}
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

      {/* Label manager modal (opened from the Add label dropdown) */}
      <LabelManager open={labelManagerOpen} onOpenChange={setLabelManagerOpen} />
    </div>
  );
}

/**
 * Attachment card with icon by file type and download link.
 */
function AttachmentCard({ attachment }: { attachment: EmailAttachment }) {
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
      <Button
        variant="ghost"
        size="sm"
        asChild
      >
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
