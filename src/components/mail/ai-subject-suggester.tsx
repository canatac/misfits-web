"use client";

/**
 * AI subject suggester — a small button placed next to the subject field that
 * generates 3 subject-line suggestions from the email body and shows them in a
 * dropdown. Clicking a suggestion applies it.
 */
import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGenerateSubject } from "@/hooks/use-ai";
import { stripHtml } from "@/lib/ai-prompts";

interface AISubjectSuggesterProps {
  /** Current email body (HTML). */
  body: string;
  /** Apply the chosen subject to the composer. */
  onApply: (subject: string) => void;
  disabled?: boolean;
}

export function AISubjectSuggester({
  body,
  onApply,
  disabled,
}: AISubjectSuggesterProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const mutation = useGenerateSubject();

  const handleGenerate = async () => {
    const text = stripHtml(body).trim();
    if (!text) {
      toast.error("Écris d'abord le corps de l'email pour générer un objet.");
      return;
    }
    setOpen(true);
    setSuggestions([]);
    try {
      const result = await mutation.mutateAsync(body);
      setSuggestions(result);
      if (result.length === 0) {
        toast.error("Aucune suggestion générée. Réessaye.");
      }
    } catch (err) {
      toast.error(
        (err as Error).message || "Échec de la génération de l'objet."
      );
      setOpen(false);
    }
  };

  const handleApply = (subject: string) => {
    onApply(subject);
    setOpen(false);
    toast.success("Objet appliqué.");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={disabled || mutation.isPending}
          className="gap-1.5 text-[var(--color-brand-500)]"
          aria-label="Suggérer un objet avec l'IA"
          data-testid="ai-subject-suggester"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Objet IA</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1">
        <div className="px-2 py-1.5 text-xs font-medium tracking-wide text-[var(--color-muted-fg)] uppercase">
          Suggestions d&apos;objet
        </div>
        {suggestions.length === 0 && !mutation.isPending && (
          <div className="px-2 py-3 text-sm text-[var(--color-muted-fg)]">
            Aucune suggestion.
          </div>
        )}
        {suggestions.map((subject, i) => (
          <button
            key={`${subject}-${i}`}
            type="button"
            onClick={() => handleApply(subject)}
            className={cn(
              "flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm text-[var(--color-fg)] transition-colors outline-none",
              "hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-fg)]"
            )}
          >
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0"
              aria-hidden="true"
            />
            <span>{subject}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
