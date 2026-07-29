"use client";

/**
 * AI composer panel — a floating panel that slides in from the right side of
 * the composer. Lets the user describe an email in natural language, pick a
 * tone / length / language, and stream a generated draft. Provides quick
 * actions to rewrite or translate the selected text, and a history of recent
 * prompts. Generated text is inserted into the bound Tiptap editor (replace or
 * append).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  X,
  Wand2,
  Languages,
  ClipboardPaste,
  History,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Editor } from "@tiptap/react";
import {
  useGenerateEmail,
  useRewriteText,
  useTranslateText,
} from "@/hooks/use-ai";
import { useAIStore } from "@/stores/ai-store";
import type { AILength, AITone, AITranslationLang } from "@/types/ai";

interface AIComposerPanelProps {
  open: boolean;
  editor: Editor | null;
  onClose: () => void;
}

const TONE_OPTIONS: { value: AITone; label: string }[] = [
  { value: "professionnel", label: "Professionnel" },
  { value: "amical", label: "Amical" },
  { value: "direct", label: "Direct" },
  { value: "formel", label: "Formel" },
  { value: "decontracte", label: "Décontracté" },
];

const LENGTH_OPTIONS: { value: AILength; label: string }[] = [
  { value: "concis", label: "Concis" },
  { value: "standard", label: "Standard" },
  { value: "detaille", label: "Détaillé" },
];

const LANG_OPTIONS: { value: AITranslationLang; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
];

type InsertMode = "replace" | "append";

export function AIComposerPanel({
  open,
  editor,
  onClose,
}: AIComposerPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<AITone>("professionnel");
  const [length, setLength] = useState<AILength>("standard");
  const [language, setLanguage] = useState<AITranslationLang>("fr");
  const [insertMode, setInsertMode] = useState<InsertMode>("append");
  const [streamingOutput, setStreamingOutput] = useState("");
  const [hasSelection, setHasSelection] = useState(false);

  const generateMutation = useGenerateEmail();
  const rewriteMutation = useRewriteText();
  const translateMutation = useTranslateText();
  const history = useAIStore((s) => s.history);
  const error = useAIStore((s) => s.error);
  const clearError = useAIStore((s) => s.clearError);
  const clearHistory = useAIStore((s) => s.clearHistory);

  const isGenerating =
    generateMutation.isPending ||
    rewriteMutation.isPending ||
    translateMutation.isPending;

  // Track whether the editor has a non-empty selection (for quick actions).
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { empty } = editor.state.selection;
      setHasSelection(!empty);
    };
    editor.on("selectionUpdate", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  // Surface store errors as toasts.
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const getSelectedText = useCallback((): string | null => {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    return editor.state.doc.textBetween(from, to, "\n");
  }, [editor]);

  const insertIntoEditor = useCallback(
    (html: string, mode: InsertMode) => {
      if (!editor || !html.trim()) return;
      if (mode === "replace") {
        editor.chain().focus().setContent(html).run();
      } else {
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, html).run();
      }
      toast.success(
        mode === "replace" ? "Texte remplacé." : "Texte ajouté à l'email.",
      );
    },
    [editor],
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Décris d'abord ce que tu veux écrire.");
      return;
    }
    setStreamingOutput("");
    try {
      const response = await generateMutation.mutateAsync({
        req: { prompt, tone, length, language },
        onChunk: (_chunk, full) => setStreamingOutput(full),
      });
      setStreamingOutput(response.content);
    } catch {
      // error already surfaced via the store
    }
  }, [prompt, tone, length, language, generateMutation]);

  const handleRewriteSelection = useCallback(async () => {
    const selected = getSelectedText();
    if (!selected) {
      toast.error("Sélectionne d'abord le texte à réécrire.");
      return;
    }
    try {
      const response = await rewriteMutation.mutateAsync({
        text: selected,
        tone,
        length,
      });
      if (editor) {
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(response.content).run();
      }
      toast.success("Sélection réécrite.");
    } catch {
      // surfaced via store
    }
  }, [getSelectedText, tone, length, rewriteMutation, editor]);

  const handleTranslateSelection = useCallback(async () => {
    const selected = getSelectedText();
    if (!selected) {
      toast.error("Sélectionne d'abord le texte à traduire.");
      return;
    }
    try {
      const response = await translateMutation.mutateAsync({
        text: selected,
        target: language,
      });
      if (editor) {
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(response.content).run();
      }
      toast.success(`Sélection traduite en ${LANG_OPTIONS.find((l) => l.value === language)?.label}.`);
    } catch {
      // surfaced via store
    }
  }, [getSelectedText, language, translateMutation, editor]);

  const recentPrompts = useMemo(
    () =>
      history
        .map((c) => c.messages.find((m) => m.role === "user")?.content ?? "")
        .filter((s) => s.length > 0)
        .slice(0, 8),
    [history],
  );

  const output = streamingOutput || generateMutation.data?.content || "";

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-[var(--z-popover)] flex w-80 max-w-[85vw] flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-fg)] shadow-[var(--shadow-xl)] transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
      data-testid="ai-composer-panel"
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
        <span className="text-sm font-medium">Assistant IA</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
          onClick={onClose}
          aria-label="Fermer le panneau IA"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {/* Prompt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-fg)]">
              Demande
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Écris cet email pour moi…"
              rows={4}
              className="resize-none text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Tone + Length */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                Ton
              </label>
              <Select value={tone} onValueChange={(v) => setTone(v as AITone)} disabled={isGenerating}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                Longueur
              </label>
              <Select value={length} onValueChange={(v) => setLength(v as AILength)} disabled={isGenerating}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-fg)]">
              Langue
            </label>
            <Select value={language} onValueChange={(v) => setLanguage(v as AITranslationLang)} disabled={isGenerating}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            loading={generateMutation.isPending}
            className="gap-1.5"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Générer
              </>
            )}
          </Button>

          {/* Output preview */}
          {output && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                  Aperçu
                </label>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={insertMode === "replace" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setInsertMode("replace")}
                      >
                        Remplacer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remplacer tout le corps</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={insertMode === "append" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setInsertMode("append")}
                      >
                        Ajouter
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ajouter à la fin</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div
                className="prose-mail max-h-60 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2.5 text-sm text-[var(--color-fg)]"
                // biome-ignore lint: AI output is HTML generated for the composer
                dangerouslySetInnerHTML={{ __html: output }}
              />
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => insertIntoEditor(output, insertMode)}
                disabled={!editor}
              >
                <ClipboardPaste className="h-4 w-4" />
                Insérer ({insertMode === "replace" ? "remplacer" : "ajouter"})
              </Button>
            </div>
          )}

          <Separator />

          {/* Quick actions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-muted-fg)]">
              Actions sur la sélection
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRewriteSelection}
                disabled={isGenerating || !hasSelection || !editor}
                loading={rewriteMutation.isPending}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Réécrire
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleTranslateSelection}
                disabled={isGenerating || !hasSelection || !editor}
                loading={translateMutation.isPending}
              >
                <Languages className="h-3.5 w-3.5" />
                Traduire
              </Button>
            </div>
            {!hasSelection && (
              <p className="text-xs text-[var(--color-muted-fg)]">
                {"Sélectionne du texte dans l'éditeur pour le réécrire ou le traduire."}
              </p>
            )}
          </div>

          {/* History */}
          {recentPrompts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
                <label className="text-xs font-medium text-[var(--color-muted-fg)]">
                  Historique
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={clearHistory}
                  aria-label="Vider l'historique"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                {recentPrompts.map((p, i) => (
                  <button
                    key={`${i}-${p.slice(0, 20)}`}
                    type="button"
                    onClick={() => {
                      setPrompt(p);
                      setStreamingOutput("");
                    }}
                    className="truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
                    title={p}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
