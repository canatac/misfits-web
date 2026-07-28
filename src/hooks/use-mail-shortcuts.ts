/**
 * Keyboard shortcuts hook for the mail interface.
 * j/k: navigate emails, e: archive, #: delete, c: compose, /: search focus, Esc: close
 * Only active when not in input/textarea/contenteditable.
 */
import { useEffect, useCallback } from "react";

export interface MailShortcutHandlers {
  onNext: () => void;
  onPrev: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCompose: () => void;
  onSearchFocus: () => void;
  onClose: () => void;
  onToggleStar?: () => void;
  onMarkUnread?: () => void;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const EDITABLE_ATTR = "true";

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  if (el.isContentEditable) return true;
  if (el.getAttribute("contenteditable") === EDITABLE_ATTR) return true;
  return false;
}

export function useMailShortcuts(handlers: MailShortcutHandlers): void {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      // Meta/Ctrl + k is a global search (browser or command palette)
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "/") {
          e.preventDefault();
          handlers.onSearchFocus();
          return;
        }
        return;
      }

      switch (e.key) {
        case "j":
          e.preventDefault();
          handlers.onNext();
          break;
        case "k":
          e.preventDefault();
          handlers.onPrev();
          break;
        case "e":
          e.preventDefault();
          handlers.onArchive();
          break;
        case "#":
          e.preventDefault();
          handlers.onDelete();
          break;
        case "c":
          e.preventDefault();
          handlers.onCompose();
          break;
        case "/":
          e.preventDefault();
          handlers.onSearchFocus();
          break;
        case "Escape":
          e.preventDefault();
          handlers.onClose();
          break;
        case "s":
          if (handlers.onToggleStar) {
            e.preventDefault();
            handlers.onToggleStar();
          }
          break;
        case "u":
          if (handlers.onMarkUnread) {
            e.preventDefault();
            handlers.onMarkUnread();
          }
          break;
        default:
          break;
      }
    },
    [handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
