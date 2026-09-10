/**
 * Attachment preview lightbox (Issue #451).
 *
 * Full-screen lightbox overlay for image attachments with navigation,
 * download, and mobile swipe gestures.
 */

export interface LightboxAttachment {
  id: string;
  url: string;
  name: string;
  type: "image" | "pdf" | "document";
  thumbnail?: string;
}

export interface LightboxState {
  isOpen: boolean;
  attachments: LightboxAttachment[];
  currentIndex: number;
}

export interface LightboxAction {
  type: "OPEN" | "CLOSE" | "NEXT" | "PREVIOUS" | "GO_TO";
  payload?: { index?: number; attachments?: LightboxAttachment[] };
}

export const initialState: LightboxState = {
  isOpen: false,
  attachments: [],
  currentIndex: 0,
};

/**
 * Reducer for lightbox state.
 */
export function lightboxReducer(
  state: LightboxState,
  action: LightboxAction
): LightboxState {
  switch (action.type) {
    case "OPEN":
      return {
        ...state,
        isOpen: true,
        attachments: action.payload?.attachments ?? [],
        currentIndex: action.payload?.index ?? 0,
      };
    case "CLOSE":
      return { ...initialState };
    case "NEXT":
      return {
        ...state,
        currentIndex: (state.currentIndex + 1) % state.attachments.length,
      };
    case "PREVIOUS":
      return {
        ...state,
        currentIndex:
          (state.currentIndex - 1 + state.attachments.length) %
          state.attachments.length,
      };
    case "GO_TO":
      return {
        ...state,
        currentIndex: action.payload?.index ?? state.currentIndex,
      };
    default:
      return state;
  }
}

/**
 * Open lightbox with attachments.
 */
export function openLightbox(
  attachments: LightboxAttachment[],
  index: number = 0
): LightboxAction {
  return { type: "OPEN", payload: { attachments, index } };
}

/**
 * Close lightbox.
 */
export function closeLightbox(): LightboxAction {
  return { type: "CLOSE" };
}

/**
 * Go to next attachment.
 */
export function nextAttachment(): LightboxAction {
  return { type: "NEXT" };
}

/**
 * Go to previous attachment.
 */
export function previousAttachment(): LightboxAction {
  return { type: "PREVIOUS" };
}

/**
 * Go to specific attachment.
 */
export function goToAttachment(index: number): LightboxAction {
  return { type: "GO_TO", payload: { index } };
}

/**
 * Get current attachment.
 */
export function getCurrentAttachment(
  state: LightboxState
): LightboxAttachment | null {
  return state.attachments[state.currentIndex] ?? null;
}

/**
 * Check if lightbox is open.
 */
export function isLightboxOpen(state: LightboxState): boolean {
  return state.isOpen;
}

/**
 * Get attachment counter text.
 */
export function getCounterText(state: LightboxState): string {
  if (state.attachments.length === 0) return "";
  return `${state.currentIndex + 1} of ${state.attachments.length}`;
}

/**
 * Check if has multiple attachments.
 */
export function hasMultipleAttachments(state: LightboxState): boolean {
  return state.attachments.length > 1;
}

/**
 * Check if can navigate next.
 */
export function canNavigateNext(state: LightboxState): boolean {
  return state.currentIndex < state.attachments.length - 1;
}

/**
 * Check if can navigate previous.
 */
export function canNavigatePrevious(state: LightboxState): boolean {
  return state.currentIndex > 0;
}

/**
 * Get download URL for current attachment.
 */
export function getDownloadUrl(state: LightboxState): string | null {
  const attachment = getCurrentAttachment(state);
  return attachment?.url ?? null;
}

/**
 * Handle keyboard navigation.
 */
export function handleKeyboardNavigation(
  state: LightboxState,
  key: string
): LightboxAction | null {
  switch (key) {
    case "Escape":
      return closeLightbox();
    case "ArrowRight":
      return nextAttachment();
    case "ArrowLeft":
      return previousAttachment();
    default:
      return null;
  }
}
