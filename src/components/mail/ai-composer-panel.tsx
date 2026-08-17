"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Editor } from "@tiptap/react";
import {
  useGenerateEmail,
  useRewriteText,
  useTranslateText,
} from "@/hooks/use-ai";
import { useAIStore } from "@/stores/ai-store";
import type { AILength, AITone, AITranslationLang } from "@/types/ai";
import { ComposerOptions } from "./parts/ai-composer/composer-options";
import {
  OutputPreview,
  type InsertMode,
} from "./parts/ai-composer/output-preview";
import {
  QuickActions,
  PromptHistory,
} from "./parts/ai-composer/quick-actions";
import { useAIActions } from "./parts/ai-composer/use-ai-actions";

interface AIComposerPanelProps {
  open: boolean;
  editor: Editor | null;
  onClose: () => void;
}

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

  useEffect(() => {
    if (!editor) return;
    const update = () => setHasSelection(!editor.state.selection.empty);
    editor.on("selectionUpdate", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const insertIntoEditor = useCallback(
    (html: string, mode: InsertMode) => {
      if (!editor || !html.trim()) return;
      if (mode === "replace") {
        editor.chain().focus().setContent(html).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContentAt(editor.state.doc.content.size, html)
          .run();
      }
      toast.success(
        mode === "replace" ? "Texte remplacé." : "Texte ajouté à l'email."
      );
    },
    [editor]
  );

  const { handleGenerate, handleRewriteSelection, handleTranslateSelection } =
    useAIActions({
      editor,
      prompt,
      tone,
      length,
      language,
      generateMutation,
      rewriteMutation,
      translateMutation,
      setStreamingOutput,
    });

  const recentPrompts = useMemo(
    () =>
      history
        .map((c) => c.messages.find((m) => m.role === "user")?.content ?? "")
        .filter((s) => s.length > 0)
        .slice(0, 8),
    [history]
  );

  const output = streamingOutput || generateMutation.data?.content || "";

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-[var(--z-popover)] flex w-80 max-w-[85vw] flex-col border-l border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-fg)] shadow-[var(--shadow-xl)] transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full"
      )}
      data-testid="ai-composer-panel"
      aria-hidden={!open}
    >
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

          <ComposerOptions
            tone={tone}
            length={length}
            language={language}
            onTone={setTone}
            onLength={setLength}
            onLanguage={setLanguage}
            disabled={isGenerating}
          />

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

          <OutputPreview
            output={output}
            insertMode={insertMode}
            setInsertMode={setInsertMode}
            onInsert={() => insertIntoEditor(output, insertMode)}
            disabled={!editor}
          />

          <Separator />

          <QuickActions
            onRewrite={handleRewriteSelection}
            onTranslate={handleTranslateSelection}
            hasSelection={hasSelection}
            hasEditor={!!editor}
            isGenerating={isGenerating}
            rewritePending={rewriteMutation.isPending}
            translatePending={translateMutation.isPending}
          />

          <PromptHistory
            prompts={recentPrompts}
            onPick={(p) => {
              setPrompt(p);
              setStreamingOutput("");
            }}
            onClear={clearHistory}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
