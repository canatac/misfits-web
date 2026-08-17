"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import type {
  useGenerateEmail,
  useRewriteText,
  useTranslateText,
} from "@/hooks/use-ai";
import type { AILength, AITone, AITranslationLang } from "@/types/ai";
import { LANG_OPTIONS } from "./composer-options";

type GenerateMutation = ReturnType<typeof useGenerateEmail>;
type RewriteMutation = ReturnType<typeof useRewriteText>;
type TranslateMutation = ReturnType<typeof useTranslateText>;

interface UseAIActionsOptions {
  editor: Editor | null;
  prompt: string;
  tone: AITone;
  length: AILength;
  language: AITranslationLang;
  generateMutation: GenerateMutation;
  rewriteMutation: RewriteMutation;
  translateMutation: TranslateMutation;
  setStreamingOutput: (v: string) => void;
}

export function useAIActions({
  editor,
  prompt,
  tone,
  length,
  language,
  generateMutation,
  rewriteMutation,
  translateMutation,
  setStreamingOutput,
}: UseAIActionsOptions) {
  const getSelectedText = useCallback((): string | null => {
    if (!editor) return null;
    const { from, to, empty } = editor.state.selection;
    if (empty) return null;
    return editor.state.doc.textBetween(from, to, "\n");
  }, [editor]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Décris d'abord ce que tu veux écrire.");
      return;
    }
    setStreamingOutput("");
    try {
      const response = await generateMutation.mutateAsync({
        req: { prompt, tone, length, language },
        onChunk: (_c, full) => setStreamingOutput(full),
      });
      setStreamingOutput(response.content);
    } catch {
      // surfaced via store
    }
  }, [prompt, tone, length, language, generateMutation, setStreamingOutput]);

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
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(response.content)
          .run();
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
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(response.content)
          .run();
      }
      toast.success(
        `Sélection traduite en ${LANG_OPTIONS.find((l) => l.value === language)?.label}.`
      );
    } catch {
      // surfaced via store
    }
  }, [getSelectedText, language, translateMutation, editor]);

  return { handleGenerate, handleRewriteSelection, handleTranslateSelection };
}
