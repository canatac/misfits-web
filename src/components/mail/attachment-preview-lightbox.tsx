"use client";

/**
 * AttachmentPreviewLightbox — full-screen modal for inline image preview
 * with keyboard navigation, backdrop dismiss, and download button.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EmailAttachment } from "@/types/email";

interface AttachmentPreviewLightboxProps {
  attachments: EmailAttachment[];
  initialIndex: number;
  onClose: () => void;
}

export function AttachmentPreviewLightbox({
  attachments,
  initialIndex,
  onClose,
}: AttachmentPreviewLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const attachment = attachments[index];
  const hasPrev = index > 0;
  const hasNext = index < attachments.length - 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => (i < attachments.length - 1 ? i + 1 : i));
  }, [attachments.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  const isImage = attachment.contentType?.startsWith("image/");
  const previewUrl = attachment.previewUrl ?? attachment.url;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Attachment preview"
      data-testid="attachment-preview-lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
        aria-label="Close preview"
        data-testid="lightbox-close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
        {index + 1} of {attachments.length}
      </div>

      {/* Backdrop click area (covers everything except the image) */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Image area */}
      <div
        className="relative z-10 flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchStart(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchStart == null) return;
          const end = e.changedTouches[0]?.clientX ?? touchStart;
          const diff = touchStart - end;
          if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
          }
          setTouchStart(null);
        }}
      >
        {/* Prev arrow */}
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Previous attachment"
            data-testid="lightbox-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {isImage && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={attachment.filename}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            data-testid="lightbox-image"
          />
        ) : (
          <div
            className="flex flex-col items-center gap-4 rounded-lg bg-white/10 p-8 text-white"
            data-testid="lightbox-non-image"
          >
            <span className="text-lg font-medium">{attachment.filename}</span>
            <span className="text-sm text-white/70">
              {attachment.contentType || "Unknown type"}
            </span>
          </div>
        )}

        {/* Next arrow */}
        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Next attachment"
            data-testid="lightbox-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom bar with download */}
      <div className="absolute bottom-4 z-10 flex items-center gap-3">
        <Button variant="secondary" size="sm" asChild>
          <a
            href={attachment.downloadUrl ?? attachment.url ?? "#"}
            download={attachment.filename}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Download ${attachment.filename}`}
            data-testid="lightbox-download"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
