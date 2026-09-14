/**
 * Screen Reader Announcements for Email Selection Changes
 *
 * Provides ARIA live region announcements when:
 * - Email selection changes
 * - Selection is cleared
 * - Bulk actions are performed
 */


export type AnnouncementTone = "assertive" | "polite";
export interface SelectionAnnounceOptions { count: number; itemLabel?: string; tone?: AnnouncementTone }

export function announceSelectionChange(opts: SelectionAnnounceOptions): string {
  const { count, itemLabel } = opts;
  if (count === 0) return "Selection cleared.";
  if (count === 1 && itemLabel) return `${itemLabel} selected.`;
  return `${count} items selected.`;
}

export function announceSelectionCleared(): string { return "All items deselected."; }
export function announceSelectAll(total: number): string { return `All ${total} items selected.`; }
export function announceDeselectAll(): string { return "All items deselected."; }

export function announceToggleResult(selected: boolean, label?: string): string {
  if (selected) return label ? `${label} selected.` : "Item selected.";
  return label ? `${label} deselected.` : "Item deselected.";
}

export function getLiveRegionProps(tone: AnnouncementTone = "polite"): Record<string, string | boolean> {
  return { "aria-live": tone, "aria-atomic": true, role: tone === "assertive" ? "alert" : "status" };
}
export type AnnouncementPriority = 'polite' | 'assertive';

export interface Announcement {
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

let liveRegion: HTMLElement | null = null;
let announcementQueue: Announcement[] = [];
let isProcessingQueue = false;

/**
 * Create and inject the live region element (client-side only)
 */
export function initAnnouncer(): HTMLElement {
  if (typeof document === 'undefined') {
    return null as any;
  }

  if (liveRegion) return liveRegion;

  liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
  document.body.appendChild(liveRegion);

  return liveRegion;
}

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
  if (typeof document === 'undefined') return;

  const region = initAnnouncer();
  announcementQueue.push({ message, priority, timestamp: Date.now() });
  processQueue();
}

/**
 * Announce email selection change
 */
export function announceSelectionChange(count: number): void {
  const message = count === 0
    ? 'Selection cleared'
    : count === 1
      ? '1 email selected'
      : `${count} emails selected`;
  announce(message);
}

/**
 * Announce bulk action result
 */
export function announceBulkAction(action: string, count: number): void {
  const messages: Record<string, string> = {
    archive: `Archived ${count} emails`,
    delete: `Moved ${count} emails to trash`,
    label: `Applied label to ${count} emails`,
    markRead: `Marked ${count} emails as read`,
    markUnread: `Marked ${count} emails as unread`,
  };
  announce(messages[action] || `${action} applied to ${count} emails`);
}

/**
 * Clear the announcement queue
 */
export function clearAnnouncements(): void {
  announcementQueue = [];
  if (liveRegion) liveRegion.textContent = '';
}

function processQueue(): void {
  if (isProcessingQueue || announcementQueue.length === 0) return;
  isProcessingQueue = true;

  const announcement = announcementQueue.shift()!;
  if (liveRegion) {
    liveRegion.textContent = '';
    // Force re-announcement
    requestAnimationFrame(() => {
      if (liveRegion) liveRegion.textContent = announcement.message;
    });
  }

  isProcessingQueue = false;
  setTimeout(processQueue, 150);
}
