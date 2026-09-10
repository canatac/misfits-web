"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, ChevronUp, ChevronDown, CaseSensitive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FindInPageProps {
  /** Ref to the email body element to search within */
  bodyRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the find bar is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
}

/**
 * FindInPage — a Cmd+F-style search bar that highlights matches
 * inside the email body and navigates between them.
 *
 * Uses a non-destructive approach: it walks text nodes inside the
 * body ref and wraps matches in <mark> elements. On close (or new
 * search) it restores the original HTML so React's dangerouslySetInnerHTML
 * stays the source of truth.
 */
export function FindInPage({
  bodyRef,
  open,
  onClose,
}: FindInPageProps) {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalHtmlRef = useRef<string | null>(null);

  // Store original HTML on first open
  useEffect(() => {
    if (open && bodyRef.current && originalHtmlRef.current === null) {
      originalHtmlRef.current = bodyRef.current.innerHTML;
    }
    if (!open) {
      originalHtmlRef.current = null;
    }
  }, [open, bodyRef]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to let the bar render
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Restore original HTML on close
  const restoreOriginal = useCallback(() => {
    if (bodyRef.current && originalHtmlRef.current !== null) {
      bodyRef.current.innerHTML = originalHtmlRef.current;
    }
    setMatchCount(0);
    setActiveIndex(0);
    setQuery("");
  }, [bodyRef]);

  const handleClose = useCallback(() => {
    restoreOriginal();
    onClose();
  }, [restoreOriginal, onClose]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  const applySearch = useCallback(
    (rawQuery: string) => {
      const body = bodyRef.current;
      if (!body) return;

      // Restore original HTML first
      if (originalHtmlRef.current !== null) {
        body.innerHTML = originalHtmlRef.current;
      }

      if (!rawQuery) {
        setMatchCount(0);
        setActiveIndex(0);
        return;
      }

      const flags = caseSensitive ? "g" : "gi";
      // Escape regex special chars
      const escaped = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, flags);

      // Walk text nodes and wrap matches in <mark>
      const walker = document.createTreeWalker(
        body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip script/style and already-marked nodes
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (
              parent.tagName === "SCRIPT" ||
              parent.tagName === "STYLE" ||
              parent.tagName === "MARK"
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            if (regex.test(node.textContent || "")) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          },
        }
      );

      const nodesToProcess: Text[] = [];
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        nodesToProcess.push(node);
      }

      let totalMatches = 0;
      for (const textNode of nodesToProcess) {
        const text = textNode.textContent || "";
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
          // Text before match
          if (match.index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, match.index))
            );
          }
          // The match wrapped in <mark>
          const mark = document.createElement("mark");
          mark.className = "find-in-page-match";
          mark.style.backgroundColor = "var(--color-warning-500)";
          mark.style.color = "var(--color-bg)";
          mark.style.borderRadius = "2px";
          mark.style.padding = "0 1px";
          mark.textContent = match[0];
          fragment.appendChild(mark);
          totalMatches++;
          lastIndex = match.index + match[0].length;
          // Prevent infinite loop on zero-length matches
          if (match[0].length === 0) regex.lastIndex++;
        }
        // Remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        textNode.parentElement?.replaceChild(fragment, textNode);
      }

      setMatchCount(totalMatches);
      setActiveIndex(totalMatches > 0 ? 1 : 0);

      // Scroll first match into view
      if (totalMatches > 0) {
        const firstMark = body.querySelector("mark.find-in-page-match");
        firstMark?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [bodyRef, caseSensitive]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    applySearch(value);
  };

  const handleCaseToggle = () => {
    setCaseSensitive((prev) => {
      const next = !prev;
      // Re-apply with new setting
      setTimeout(() => applySearch(query), 0);
      return next;
    });
  };

  const goToPrev = () => {
    if (matchCount === 0) return;
    const next = activeIndex <= 1 ? matchCount : activeIndex - 1;
    setActiveIndex(next);
    scrollToMatch(next);
  };

  const goToNext = () => {
    if (matchCount === 0) return;
    const next = activeIndex >= matchCount ? 1 : activeIndex + 1;
    setActiveIndex(next);
    scrollToMatch(next);
  };

  const scrollToMatch = (index: number) => {
    const marks = bodyRef.current?.querySelectorAll("mark.find-in-page-match");
    if (!marks || marks.length === 0) return;
    const mark = marks[index - 1] as HTMLElement | undefined;
    if (mark) {
      // Remove active class from all, add to current
      marks.forEach((m) => {
        (m as HTMLElement).style.outline = "none";
      });
      mark.style.outline = "2px solid var(--color-brand-500)";
      mark.style.outlineOffset = "2px";
      mark.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  if (!open) return null;

  return (
    <div
      className="flex items-center gap-2 border-t border-[#242427] bg-[#121214] px-3 py-2"
      data-testid="find-in-page-bar"
    >
      <Search className="h-4 w-4 shrink-0 text-[#C49B66]" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) goToPrev();
            else goToNext();
          }
        }}
        placeholder="Find in email…"
        className="h-8 flex-1 border-[#242427] bg-[#0A0A0B] text-sm text-[#E0E0E0] placeholder:text-[#666]"
        data-testid="find-in-page-input"
      />
      <span
        className={cn(
          "shrink-0 font-mono text-xs",
          matchCount > 0 ? "text-[#C49B66]" : "text-[#666]"
        )}
        data-testid="find-in-page-counter"
      >
        {matchCount > 0 ? `${activeIndex}/${matchCount}` : "0/0"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCaseToggle}
        aria-label="Match case"
        data-testid="find-in-page-case-toggle"
      >
        <CaseSensitive
          className={cn(
            "h-4 w-4",
            caseSensitive ? "text-[#C49B66]" : "text-[#666]"
          )}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goToPrev}
        aria-label="Previous match"
        disabled={matchCount === 0}
        data-testid="find-in-page-prev"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goToNext}
        aria-label="Next match"
        disabled={matchCount === 0}
        data-testid="find-in-page-next"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleClose}
        aria-label="Close find"
        data-testid="find-in-page-close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
