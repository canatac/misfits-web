/**
 * Unit tests for attachment lightbox.
 */
import { describe, it, expect } from "vitest";
import {
  lightboxReducer,
  initialState,
  openLightbox,
  closeLightbox,
  nextAttachment,
  previousAttachment,
  goToAttachment,
  getCurrentAttachment,
  isLightboxOpen,
  getCounterText,
  hasMultipleAttachments,
  canNavigateNext,
  canNavigatePrevious,
  getDownloadUrl,
  handleKeyboardNavigation,
} from "@/lib/attachment-lightbox";

const SAMPLE_ATTACHMENTS = [
  { id: "a1", url: "/test1.jpg", name: "test1.jpg", type: "image" as const },
  { id: "a2", url: "/test2.jpg", name: "test2.jpg", type: "image" as const },
  { id: "a3", url: "/test3.jpg", name: "test3.jpg", type: "image" as const },
];

describe("attachment-lightbox", () => {
  describe("lightboxReducer", () => {
    it("handles OPEN action", () => {
      const action = openLightbox(SAMPLE_ATTACHMENTS, 0);
      const state = lightboxReducer(initialState, action);
      expect(state.isOpen).toBe(true);
      expect(state.attachments).toEqual(SAMPLE_ATTACHMENTS);
      expect(state.currentIndex).toBe(0);
    });

    it("handles CLOSE action", () => {
      let state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      state = lightboxReducer(state, closeLightbox());
      expect(state.isOpen).toBe(false);
      expect(state.attachments).toEqual([]);
    });

    it("handles NEXT action", () => {
      let state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 0));
      state = lightboxReducer(state, nextAttachment());
      expect(state.currentIndex).toBe(1);
    });

    it("wraps around on NEXT at end", () => {
      let state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 2)
      );
      state = lightboxReducer(state, nextAttachment());
      expect(state.currentIndex).toBe(0);
    });

    it("handles PREVIOUS action", () => {
      let state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 1));
      state = lightboxReducer(state, previousAttachment());
      expect(state.currentIndex).toBe(0);
    });

    it("wraps around on PREVIOUS at start", () => {
      let state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 0));
      state = lightboxReducer(state, previousAttachment());
      expect(state.currentIndex).toBe(2);
    });

    it("handles GO_TO action", () => {
      let state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 0));
      state = lightboxReducer(state, goToAttachment(2));
      expect(state.currentIndex).toBe(2);
    });
  });

  describe("getCurrentAttachment", () => {
    it("returns current attachment", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 1));
      const attachment = getCurrentAttachment(state);
      expect(attachment).toEqual(SAMPLE_ATTACHMENTS[1]);
    });

    it("returns null when no attachments", () => {
      const attachment = getCurrentAttachment(initialState);
      expect(attachment).toBeNull();
    });
  });

  describe("isLightboxOpen", () => {
    it("returns false initially", () => {
      expect(isLightboxOpen(initialState)).toBe(false);
    });

    it("returns true when open", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      expect(isLightboxOpen(state)).toBe(true);
    });
  });

  describe("getCounterText", () => {
    it("returns empty string when no attachments", () => {
      expect(getCounterText(initialState)).toBe("");
    });

    it("returns counter text", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 1)
      );
      expect(getCounterText(state)).toBe("2 of 3");
    });
  });

  describe("hasMultipleAttachments", () => {
    it("returns false for single attachment", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox([SAMPLE_ATTACHMENTS[0]])
      );
      expect(hasMultipleAttachments(state)).toBe(false);
    });

    it("returns true for multiple", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS)
      );
      expect(hasMultipleAttachments(state)).toBe(true);
    });
  });

  describe("canNavigateNext", () => {
    it("returns true when not at end", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 0)
      );
      expect(canNavigateNext(state)).toBe(true);
    });

    it("returns false when at end", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 2)
      );
      expect(canNavigateNext(state)).toBe(false);
    });
  });

  describe("canNavigatePrevious", () => {
    it("returns true when not at start", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 1)
      );
      expect(canNavigatePrevious(state)).toBe(true);
    });

    it("returns false when at start", () => {
      const state = lightboxReducer(
        initialState,
        openLightbox(SAMPLE_ATTACHMENTS, 0)
      );
      expect(canNavigatePrevious(state)).toBe(false);
    });
  });

  describe("getDownloadUrl", () => {
    it("returns download URL", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS, 0));
      expect(getDownloadUrl(state)).toBe("/test1.jpg");
    });

    it("returns null when no attachments", () => {
      expect(getDownloadUrl(initialState)).toBeNull();
    });
  });

  describe("handleKeyboardNavigation", () => {
    it("returns close on Escape", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      const action = handleKeyboardNavigation(state, "Escape");
      expect(action?.type).toBe("CLOSE");
    });

    it("returns next on ArrowRight", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      const action = handleKeyboardNavigation(state, "ArrowRight");
      expect(action?.type).toBe("NEXT");
    });

    it("returns previous on ArrowLeft", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      const action = handleKeyboardNavigation(state, "ArrowLeft");
      expect(action?.type).toBe("PREVIOUS");
    });

    it("returns null for unknown key", () => {
      const state = lightboxReducer(initialState, openLightbox(SAMPLE_ATTACHMENTS));
      const action = handleKeyboardNavigation(state, "Space");
      expect(action).toBeNull();
    });
  });
});
