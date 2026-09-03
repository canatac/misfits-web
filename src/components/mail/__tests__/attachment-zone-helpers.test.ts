import { describe, expect, it } from "vitest";
import {
  inferContentType,
  isAllowed,
  MAX_FILE_SIZE,
} from "@/components/mail/attachment-zone-helpers";

describe("attachment-zone-helpers", () => {
  it("infers mime type from extension when browser type is empty", () => {
    const file = new File(["hello"], "rapport.pdf", { type: "" });
    expect(inferContentType(file)).toBe("application/pdf");
  });

  it("allows known extension even when mime type is missing", () => {
    const file = new File(["hello"], "notes.docx", { type: "" });
    expect(isAllowed(file)).toBe(true);
  });

  it("maps generic octet-stream PDFs to application/pdf", () => {
    const file = new File(["hello"], "scan.PDF", {
      type: "application/octet-stream",
    });
    expect(inferContentType(file)).toBe("application/pdf");
    expect(isAllowed(file)).toBe(true);
  });

  it("rejects oversized files", () => {
    const huge = new File([new Uint8Array(MAX_FILE_SIZE + 1)], "video.mp4", {
      type: "video/mp4",
    });
    expect(isAllowed(huge)).toBe(false);
  });
});
