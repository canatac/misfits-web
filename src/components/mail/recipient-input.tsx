"use client";

/**
 * Recipient input — tag-based input with autocompletion.
 *
 * Renders a single field (To / Cc / Bcc) with chip-style recipients, inline
 * email validation, an external-recipient warning badge, contacts autocompletion
 * from mock data, and keyboard navigation (Enter to add, Backspace to remove,
 * Tab to autocomplete).
 */
import { useState, useRef, useCallback, useMemo, type KeyboardEvent } from "react";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchContacts, type MockContact } from "@/lib/mock-contacts";
import { validateRecipient } from "@/lib/email-validation";
import type { Recipient, RecipientType } from "@/types/composer";
import { uid } from "@/stores/composer-store";

interface RecipientInputProps {
  type: RecipientType;
  recipients: Recipient[];
  onAdd: (recipient: Recipient) => void;
  onRemove: (id: string) => void;
  /** Field label e.g. "To", "Cc", "Bcc". */
  label: string;
  className?: string;
  autoFocus?: boolean;
}

function initials(name: string, email: string): string {
  const base = name || email.split("@")[0] || "?";
  const parts = base.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RecipientInput({
  type,
  recipients,
  onAdd,
  onRemove,
  label,
  className,
  autoFocus,
}: RecipientInputProps) {
  const [input, setInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    return searchContacts(input, 6).filter(
      (c) => !recipients.some((r) => r.email === c.email),
    );
  }, [input, recipients]);

  const commit = useCallback(
    (email: string, name?: string, color?: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;
      const result = validateRecipient(trimmed);
      if (!result.valid) return;
      const recipient: Recipient = {
        id: uid("rcpt"),
        email: trimmed.toLowerCase(),
        name: name?.trim() || undefined,
        type,
        color,
      };
      onAdd(recipient);
      setInput("");
      setActiveIndex(-1);
    },
    [onAdd, type],
  );

  const selectSuggestion = useCallback(
    (contact: MockContact) => {
      commit(contact.email, contact.name, contact.color);
    },
    [commit],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else if (input.trim()) {
        // Try to autocomplete to the top suggestion when it's an exact email match.
        const top = suggestions[0];
        if (top && top.email.toLowerCase() === input.trim().toLowerCase()) {
          selectSuggestion(top);
        } else {
          commit(input);
        }
      }
      return;
    }
    if (e.key === "Tab" && suggestions.length > 0 && input.trim()) {
      // Tab autocompletes to the top suggestion without preventing focus move
      // when there's nothing to complete.
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else if (suggestions[0]) {
        e.preventDefault();
        selectSuggestion(suggestions[0]);
      }
      return;
    }
    if (e.key === "Backspace" && input === "" && recipients.length > 0) {
      e.preventDefault();
      onRemove(recipients[recipients.length - 1].id);
      return;
    }
    if (e.key === "," || e.key === ";") {
      if (input.trim()) {
        e.preventDefault();
        commit(input);
      }
      return;
    }
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Escape") {
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }
  };

  const showSuggestions = focused && suggestions.length > 0;
  const inputInvalid = input.trim().length > 0 && !validateRecipient(input.trim()).valid;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 px-3 py-1.5", className)}>
      <span className="shrink-0 select-none text-xs font-medium text-[var(--color-muted-fg)]">
        {label}
      </span>
      {recipients.map((r) => (
        <RecipientChip key={r.id} recipient={r} onRemove={onRemove} />
      ))}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          value={input}
          autoFocus={autoFocus}
          onChange={(e) => {
            setInput(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so click on suggestion registers first.
            setTimeout(() => setFocused(false), 150);
            // Commit raw input on blur if it's a valid email.
            if (input.trim()) {
              const res = validateRecipient(input.trim());
              if (res.valid) commit(input);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-label={`${label} recipient`}
          className={cn(
            "min-w-[120px] flex-1 bg-transparent text-sm text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted-fg)]",
            inputInvalid && "text-[var(--color-danger-500)]",
          )}
          placeholder={recipients.length === 0 ? "Recipients…" : ""}
        />
        {showSuggestions && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover)] py-1 shadow-[var(--shadow-lg)]">
            {suggestions.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(c)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                  i === activeIndex
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : "text-[var(--color-popover-fg)] hover:bg-[var(--color-muted)]",
                )}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {initials(c.name, c.email)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="truncate text-xs text-[var(--color-muted-fg)]">
                    {c.email}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipientChip({
  recipient,
  onRemove,
}: {
  recipient: Recipient;
  onRemove: (id: string) => void;
}) {
  const external = validateRecipient(recipient.email).external;
  const displayName = recipient.name || recipient.email;

  return (
    <span
      className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] py-0.5 pl-1.5 pr-1 text-sm"
      data-testid="recipient-chip"
    >
      {recipient.color && recipient.name ? (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ backgroundColor: recipient.color }}
        >
          {initials(recipient.name, recipient.email)}
        </span>
      ) : null}
      <span className="max-w-[200px] truncate">{displayName}</span>
      {external && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-warning-500)]/15 px-1 text-[10px] font-medium text-[var(--color-warning-500)]"
          title="External recipient"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          ext
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(recipient.id)}
        className="rounded-full p-0.5 text-[var(--color-muted-fg)] transition-colors hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)]"
        aria-label={`Remove ${displayName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
