import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttachmentPreviewLightbox } from "@/components/mail/attachment-preview-lightbox";
import type { EmailAttachment } from "@/types/email";

function mkAttachment(id: string, contentType: string): EmailAttachment {
  return {
    id,
    filename: `${id}.png`,
    contentType,
    size: 1024,
    type: "image",
    url: `https://example.com/${id}.png`,
    downloadUrl: `https://example.com/${id}.png`,
    previewUrl: `https://example.com/${id}.png`,
  };
}

const attachments = [
  mkAttachment("a", "image/png"),
  mkAttachment("b", "image/jpeg"),
  mkAttachment("c", "image/webp"),
];

describe("AttachmentPreviewLightbox", () => {
  it("renders the initial image", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId("lightbox-image")).toBeTruthy();
    expect(screen.getByText("1 of 3")).toBeTruthy();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to next image on ArrowRight", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("2 of 3")).toBeTruthy();
  });

  it("navigates to previous image on ArrowLeft", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={1}
        onClose={vi.fn()}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("1 of 3")).toBeTruthy();
  });

  it("hides prev arrow on first image", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId("lightbox-prev")).toBeNull();
    expect(screen.getByTestId("lightbox-next")).toBeTruthy();
  });

  it("hides next arrow on last image", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={2}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId("lightbox-next")).toBeNull();
    expect(screen.getByTestId("lightbox-prev")).toBeTruthy();
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId("attachment-preview-lightbox"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close when clicking inside the image area", () => {
    const onClose = vi.fn();
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={onClose}
      />
    );
    const imgContainer = screen.getByTestId("lightbox-image").parentElement!;
    fireEvent.click(imgContainer);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders non-image fallback for non-image attachments", () => {
    const pdf = mkAttachment("pdf", "application/pdf");
    render(
      <AttachmentPreviewLightbox
        attachments={[pdf]}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId("lightbox-non-image")).toBeTruthy();
    expect(screen.getByText("pdf.png")).toBeTruthy();
  });

  it("renders download button with correct href", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    const downloadBtn = screen.getByTestId("lightbox-download");
    expect(downloadBtn.getAttribute("href")).toBe("https://example.com/a.png");
    expect(downloadBtn.getAttribute("download")).toBe("a.png");
  });

  it("supports swipe navigation (touch events)", () => {
    render(
      <AttachmentPreviewLightbox
        attachments={attachments}
        initialIndex={0}
        onClose={vi.fn()}
      />
    );
    const container = screen.getByTestId("lightbox-image").parentElement!;
    fireEvent.touchStart(container, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(container, { changedTouches: [{ clientX: 50 }] });
    expect(screen.getByText("2 of 3")).toBeTruthy();
  });
});
