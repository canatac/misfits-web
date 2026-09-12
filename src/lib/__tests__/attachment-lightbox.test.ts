import { describe, it, expect } from 'vitest';
import {
  createLightboxState,
  openLightbox,
  closeLightbox,
  nextImage,
  previousImage,
  zoomIn,
  zoomOut,
  resetZoom,
  getCurrentImage,
  hasMultipleImages,
  canZoomIn,
  canZoomOut,
  isImageFile,
  isPreviewable,
  formatFileSize,
  type LightboxImage,
} from '../attachment-lightbox';

const sampleImages: LightboxImage[] = [
  { id: '1', url: '/img/1.jpg', name: 'photo1.jpg', mimeType: 'image/jpeg', size: 500000 },
  { id: '2', url: '/img/2.png', name: 'photo2.png', mimeType: 'image/png', size: 2000000 },
  { id: '3', url: '/doc.pdf', name: 'doc.pdf', mimeType: 'application/pdf', size: 1000000 },
];

describe('attachment-lightbox', () => {
  describe('createLightboxState', () => {
    it('creates open lightbox with images', () => {
      const state = createLightboxState(sampleImages, 1);
      expect(state.isOpen).toBe(true);
      expect(state.currentIndex).toBe(1);
      expect(state.images).toHaveLength(3);
    });

    it('clamps startIndex to valid range', () => {
      expect(createLightboxState(sampleImages, 10).currentIndex).toBe(2);
      expect(createLightboxState(sampleImages, -1).currentIndex).toBe(0);
    });
  });

  describe('openLightbox', () => {
    it('opens lightbox at specified index', () => {
      const state = openLightbox(sampleImages, 0);
      expect(state.isOpen).toBe(true);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('closeLightbox', () => {
    it('returns closed state', () => {
      const state = closeLightbox();
      expect(state.isOpen).toBe(false);
      expect(state.images).toHaveLength(0);
    });
  });

  describe('nextImage', () => {
    it('advances to next image', () => {
      const state = createLightboxState(sampleImages, 0);
      const next = nextImage(state);
      expect(next.currentIndex).toBe(1);
    });

    it('wraps around to first image', () => {
      const state = createLightboxState(sampleImages, 2);
      expect(nextImage(state).currentIndex).toBe(0);
    });
  });

  describe('previousImage', () => {
    it('goes to previous image', () => {
      const state = createLightboxState(sampleImages, 1);
      expect(previousImage(state).currentIndex).toBe(0);
    });

    it('wraps around to last image', () => {
      const state = createLightboxState(sampleImages, 0);
      expect(previousImage(state).currentIndex).toBe(2);
    });
  });

  describe('zoomIn/zoomOut', () => {
    it('zooms in by step', () => {
      const state = createLightboxState(sampleImages);
      expect(zoomIn(state).scale).toBe(1.25);
    });

    it('zooms out by step', () => {
      const state = createLightboxState(sampleImages);
      expect(zoomOut(state).scale).toBe(0.75);
    });

    it('caps zoom in at 3', () => {
      let state = createLightboxState(sampleImages, 0);
      state = { ...state, scale: 2.9 };
      expect(zoomIn(state).scale).toBe(3);
    });

    it('caps zoom out at 0.5', () => {
      let state = createLightboxState(sampleImages, 0);
      state = { ...state, scale: 0.6 };
      expect(zoomOut(state).scale).toBe(0.5);
    });
  });

  describe('resetZoom', () => {
    it('resets scale to 1', () => {
      let state = createLightboxState(sampleImages, 0);
      state = zoomIn(zoomIn(state));
      expect(resetZoom(state).scale).toBe(1);
    });
  });

  describe('getCurrentImage', () => {
    it('returns image at current index', () => {
      const state = createLightboxState(sampleImages, 1);
      expect(getCurrentImage(state)?.id).toBe('2');
    });

    it('returns null for empty images', () => {
      const state = createLightboxState([], 0);
      expect(getCurrentImage(state)).toBeNull();
    });
  });

  describe('hasMultipleImages', () => {
    it('returns true for multiple images', () => {
      expect(hasMultipleImages(createLightboxState(sampleImages))).toBe(true);
    });

    it('returns false for single image', () => {
      expect(hasMultipleImages(createLightboxState([sampleImages[0]]))).toBe(false);
    });
  });

  describe('canZoomIn/canZoomOut', () => {
    it('canZoomIn returns true when scale < 3', () => {
      expect(canZoomIn(createLightboxState(sampleImages))).toBe(true);
    });

    it('canZoomOut returns true when scale > 0.5', () => {
      expect(canZoomOut(createLightboxState(sampleImages))).toBe(true);
    });
  });

  describe('isImageFile', () => {
    it('returns true for image/jpeg', () => {
      expect(isImageFile(sampleImages[0])).toBe(true);
    });

    it('returns false for pdf', () => {
      expect(isImageFile(sampleImages[2])).toBe(false);
    });
  });

  describe('isPreviewable', () => {
    it('returns true for small images', () => {
      expect(isPreviewable(sampleImages[0])).toBe(true);
    });

    it('returns false for large files', () => {
      const large = { ...sampleImages[0], size: 11 * 1024 * 1024 };
      expect(isPreviewable(large)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats KB', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats MB', () => {
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });
  });
});
