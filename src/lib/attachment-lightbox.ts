/**
 * Attachment Preview Lightbox (Inline Image Viewer)
 *
 * Displays image attachments in a lightbox overlay when clicked.
 * Features:
 * - Full-screen image display
 * - Click-outside or ESC to close
 * - Image zoom/pan support
 * - Navigate multiple images with arrows
 */

export interface LightboxImage {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  images: LightboxImage[];
  scale: number;
}

export function createLightboxState(images: LightboxImage[] = [], startIndex = 0): LightboxState {
  return {
    isOpen: true,
    currentIndex: Math.max(0, Math.min(startIndex, images.length - 1)),
    images,
    scale: 1,
  };
}

export function openLightbox(images: LightboxImage[], index = 0): LightboxState {
  return createLightboxState(images, index);
}

export function closeLightbox(): LightboxState {
  return {
    isOpen: false,
    currentIndex: 0,
    images: [],
    scale: 1,
  };
}

export function nextImage(state: LightboxState): LightboxState {
  if (state.images.length === 0) return state;
  return {
    ...state,
    currentIndex: (state.currentIndex + 1) % state.images.length,
    scale: 1,
  };
}

export function previousImage(state: LightboxState): LightboxState {
  if (state.images.length === 0) return state;
  return {
    ...state,
    currentIndex: (state.currentIndex - 1 + state.images.length) % state.images.length,
    scale: 1,
  };
}

export function zoomIn(state: LightboxState, step = 0.25): LightboxState {
  return { ...state, scale: Math.min(state.scale + step, 3) };
}

export function zoomOut(state: LightboxState, step = 0.25): LightboxState {
  return { ...state, scale: Math.max(state.scale - step, 0.5) };
}

export function resetZoom(state: LightboxState): LightboxState {
  return { ...state, scale: 1 };
}

export function getCurrentImage(state: LightboxState): LightboxImage | null {
  return state.images[state.currentIndex] ?? null;
}

export function hasMultipleImages(state: LightboxState): boolean {
  return state.images.length > 1;
}

export function canZoomIn(state: LightboxState): boolean {
  return state.scale < 3;
}

export function canZoomOut(state: LightboxState): boolean {
  return state.scale > 0.5;
}

export function isImageFile(image: LightboxImage): boolean {
  return image.mimeType.startsWith('image/');
}

export function isPreviewable(image: LightboxImage): boolean {
  return isImageFile(image) && image.size <= 10 * 1024 * 1024; // 10MB limit
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
