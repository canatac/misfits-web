"use client";

/**
 * Inline autocomplete suggestion for search operators.
 *
 * Shows a greyed-out suggestion text after the cursor position.
 * When the user types "fr", it shows "om:" in grey.
 * Accept with Tab or Right arrow.
 */

import { useRef, useEffect, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { OperatorMeta } from "@/types/search";

interface InlineSuggestionProps {
  /** The input element ref */
  inputRef: RefObject<HTMLInputElement | null>;
  /** The suggestion to display */
  suggestion: OperatorMeta | null;
  /** The partial text the user has typed */
  partial: string;
  /** Additional class names */
  className?: string;
}

export function InlineSuggestion({
  inputRef,
  suggestion,
  partial,
  className,
}: InlineSuggestionProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!inputRef.current || !suggestion) return;

    const input = inputRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match input font
    const computed = getComputedStyle(input);
    ctx.font = `${computed.fontSize} ${computed.fontFamily}`;

    // Measure the partial text width
    const metrics = ctx.measureText(partial);
    const leftOffset = metrics.width;

    // Position the suggestion overlay
    const suggestionText = suggestion.operator.slice(partial.length) + ":";

    // Update the data attribute for styling
    input.setAttribute("data-suggestion-left", `${leftOffset}px`);
    input.setAttribute("data-suggestion-text", suggestionText);
  }, [inputRef, suggestion, partial]);

  if (!suggestion) return null;

  const suggestionText = suggestion.operator.slice(partial.length) + ":";

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 left-0 flex items-center",
        "h-full whitespace-pre text-sm",
        "text-[var(--color-muted-fg)]/50",
        "select-none",
        className
      )}
      style={{
        paddingLeft: `calc(0.75rem + ${getPartialWidth(inputRef, partial)}px)`,
      }}
      aria-hidden="true"
    >
      {suggestionText}
    </div>
  );
}

function getPartialWidth(
  inputRef: RefObject<HTMLInputElement | null>,
  partial: string
): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx || !inputRef.current) return 0;

  const computed = getComputedStyle(inputRef.current);
  ctx.font = `${computed.fontSize} ${computed.fontFamily}`;
  return ctx.measureText(partial).width;
}
