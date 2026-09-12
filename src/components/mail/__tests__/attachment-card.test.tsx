import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttachmentCard } from "@/components/mail/attachment-card";
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
  };
}

describe("AttachmentCard (with preview support)", () => {
  it("renders non-image attachment without preview callback", () => {
    const pdf = mkAttachment("pdf", "application/pdf");
    render(<AttachmentCard attachment={pdf} />);
    const btn = screen.getByTestId("attachment-card");
    expect(btn.getAttribute("disabled")).toBe("");
  });

  it("renders image attachment with preview callback as clickable", () => {
    const img = mkAttachment("img", "image/png");
    const onPreview = vi.fn();
    render(<AttachmentCard attachment={img} onPreview={onPreview} />);
    const btn = screen.getByTestId("attachment-card");
    expect(btn.getAttribute("disabled")).toBeNull();
    btn.click();
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("does not call onPreview for non-image types even when onPreview is passed", () => {
    const pdf = mkAttachment("pdf", "application/pdf");
    const onPreview = vi.fn();
    render(<AttachmentCard attachment={pdf} onPreview={onPreview} />);
    const btn = screen.getByTestId("attachment-card");
    btn.click();
    expect(onPreview).not.toHaveBeenCalled();
  });
});
