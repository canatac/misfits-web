"use client";

/**
 * Smart compose — inline ghost-text autocomplete for the Tiptap editor.
 *
 * After the user pauses typing for 500ms, the AI is asked for a short
 * continuation. The suggestion is rendered as a greyed-out overlay anchored to
 * the caret (via `editor.view.coordsAtPos`). Press Tab to accept (inserts the
 * text at the caret) or Esc to dismiss. Any further typing / selection change /
 * scroll clears the current suggestion.
 *
 * Implemented as a viewport overlay (no ProseMirror decoration) so it needs no
 * extra ProseMirror dependencies beyond the Tiptap editor instance.
 */
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useSmartComplete } from "@/hooks/use-ai";

interface SmartComposeProps {
  editor: Editor | null;
}

interface Coords {
  left: number;
  top: number;
}

export function SmartCompose({ editor }: SmartComposeProps) {
  const { suggestion, isFetching, fetch, clear } = useSmartComplete();
  const [coords, setCoords] = useState<Coords | null>(null);
  const posRef = useRef<number | null>(null);
  const suggestionRef = useRef<string>("");

  // Keep a ref of the current suggestion so the keydown handler (added once)
  // always sees the latest value.
  useEffect(() => {
    suggestionRef.current = suggestion;
  }, [suggestion]);

  // Wire editor events: trigger fetch on update, clear on selection/scroll/blur.
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      clear();
      setCoords(null);
      const { from, to, empty } = editor.state.selection;
      if (!empty) return;
      // Text typed just before the caret (last ~200 chars of the current line).
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 200),
        from,
        "\n",
      );
      const lastChar = textBefore.slice(-1);
      // Only request a completion right after actual typing (non-whitespace).
      if (!lastChar || /\s/.test(lastChar)) return;
      posRef.current = from;
      fetch(textBefore);
    };

    const handleSelectionUpdate = () => {
      clear();
      setCoords(null);
    };

    const handleBlur = () => {
      clear();
      setCoords(null);
    };

    const handleScroll = () => {
      clear();
      setCoords(null);
    };

    const dom = editor.view.dom as HTMLElement;

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", handleBlur);
    dom.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", handleBlur);
      dom.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll, { capture: true } as EventListenerOptions);
    };
  }, [editor, fetch, clear]);

  // Position the overlay whenever a (non-empty) suggestion arrives.
  useEffect(() => {
    if (!editor || !suggestion || posRef.current == null) {
      setCoords(null);
      return;
    }
    try {
      const rect = editor.view.coordsAtPos(posRef.current);
      setCoords({ left: rect.left, top: rect.top });
    } catch {
      setCoords(null);
    }
  }, [suggestion, editor]);

  // Keyboard: Tab accepts, Esc dismisses.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      const current = suggestionRef.current;
      if (!current) return;
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        editor.chain().focus().insertContent(current).run();
        clear();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clear();
      }
    };

    dom.addEventListener("keydown", handleKeyDown, true);
    return () => dom.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, clear]);

  if (!editor || !suggestion || !coords) return null;

  return (
    <span
      className="smart-compose-ghost pointer-events-none fixed z-[var(--z-popover)] select-none whitespace-pre-wrap text-sm leading-[1.625] text-[var(--color-muted-fg)]/70"
      style={{ left: coords.left, top: coords.top }}
      aria-hidden="true"
      data-testid="smart-compose-ghost"
    >
      {suggestion}
      {isFetching ? null : (
        <span className="ml-2 text-[0.65rem] opacity-60">
          Tab ↹ · Esc
        </span>
      )}
    </span>
  );
}
