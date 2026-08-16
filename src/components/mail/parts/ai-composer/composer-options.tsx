"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AILength, AITone, AITranslationLang } from "@/types/ai";

export const TONE_OPTIONS: { value: AITone; label: string }[] = [
  { value: "professionnel", label: "Professionnel" },
  { value: "amical", label: "Amical" },
  { value: "direct", label: "Direct" },
  { value: "formel", label: "Formel" },
  { value: "decontracte", label: "Décontracté" },
];

export const LENGTH_OPTIONS: { value: AILength; label: string }[] = [
  { value: "concis", label: "Concis" },
  { value: "standard", label: "Standard" },
  { value: "detaille", label: "Détaillé" },
];

export const LANG_OPTIONS: { value: AITranslationLang; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
];

interface ComposerOptionsProps {
  tone: AITone;
  length: AILength;
  language: AITranslationLang;
  onTone: (v: AITone) => void;
  onLength: (v: AILength) => void;
  onLanguage: (v: AITranslationLang) => void;
  disabled?: boolean;
}

export function ComposerOptions({
  tone,
  length,
  language,
  onTone,
  onLength,
  onLanguage,
  disabled,
}: ComposerOptionsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--color-muted-fg)]">
            Ton
          </label>
          <Select
            value={tone}
            onValueChange={(v) => onTone(v as AITone)}
            disabled={disabled}
          >
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
          <Select
            value={length}
            onValueChange={(v) => onLength(v as AILength)}
            disabled={disabled}
          >
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
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-fg)]">
          Langue
        </label>
        <Select
          value={language}
          onValueChange={(v) => onLanguage(v as AITranslationLang)}
          disabled={disabled}
        >
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
    </>
  );
}
