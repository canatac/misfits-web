"use client";
// email-view-utils.ts — extracted Sprint 4

import type { AttachmentType, EmailAttachment } from "@/types/mail";
import { FileIcon, FileText, FileSpreadsheet, FileCode, Paperclip } from "lucide-react";

export const ATTACHMENT_ICONS: Record<AttachmentType, typeof FileIcon> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  archive: ArchiveIcon,
  audio: Music,
  video: Video,
  other: FileIcon,
};

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toPlainText(body: string, bodyType: "html" | "text"): string {
  if (bodyType === "text") return body;
  return body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Regex to detect quoted reply sections
export const QUOTE_PATTERNS = [
  /<blockquote[^>]*>[\s\S]*<\/blockquote>/i,
  /On .* wrote:[\s\S]*$/i,
  /Le .* a écrit :[\s\S]*$/i,
  /-+Original Message-+[\s\S]*$/i,
  /From: .[\s\S]*$/i,
];

