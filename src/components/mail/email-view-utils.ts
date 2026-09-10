"use client";
// email-view-utils.ts — extracted Sprint 4

import type { AttachmentType, EmailAttachment } from "@/types/email";
import { toPlainText as toPlainTextImpl } from "@/lib/mail-utils";
import {
  FileIcon, FileText, FileSpreadsheet, FileCode, Paperclip,
  Image as ImageIcon, Music, Video, Archive, Presentation,
} from "lucide-react";

export const ATTACHMENT_ICONS: Record<AttachmentType, typeof FileIcon> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: Archive,
  audio: Music,
  video: Video,
  other: Paperclip,
} as Record<AttachmentType, typeof FileIcon>;

export function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function toPlainText(body: string, bodyType: "html" | "text"): string {
  // Re-export depuis lib/mail-utils.ts (Boucle 14) pour éviter cycles hooks → components.
  return toPlainTextImpl(body, bodyType);
}

export const QUOTE_PATTERNS = [
  /^-{3,}/m,
  /^_{3,}/m,
  /^From:/im,
  /^On .+ wrote:/m,
  /Le .+ a écrit\s*:/m,
];

// Re-export EmailAttachment type for consumers
export type { EmailAttachment };

export const READING_WPM = 200;
export const READING_MIN_WORDS = 20;

export interface ReadingTimeResult {
  minutes: number;
  words: number;
}

/** Estimate reading time from a string (HTML or plaintext) at 200 wpm. */
export function estimateReadingTime(raw: string): ReadingTimeResult | null {
  if (!raw) return null;
  const stripped = raw.replace(/<[^>]*>/g, " ");
  const text = stripped.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const wordList = text.trim().split(/\s+/).filter(Boolean);
  if (wordList.length < READING_MIN_WORDS) return null;
  const minutes = Math.max(1, Math.round(wordList.length / READING_WPM));
  return { minutes, words: wordList.length };
}

export function formatReadingTime(result: ReadingTimeResult | null): string {
  if (!result) return "";
  return `~${result.minutes} min read`;
}
