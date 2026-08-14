"use client";
// email-view-utils.ts — extracted Sprint 4

import type { AttachmentType, EmailAttachment } from "@/types/email";
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
  if (bodyType === "text") return body;
  return body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
