/**
 * Helpers for AttachmentZone: validation, icon mapping, size formatting,
 * and simulated upload progress. Extracted to keep attachment-zone.tsx
 * under the 250 LOC threshold.
 */
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Archive as ArchiveIcon,
  Music,
  Video,
  File as FileIcon,
} from "lucide-react";
import type { Attachment } from "@/types/composer";

/** Max total attachment size (25 MB). */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Allowed MIME type prefixes. */
export const ALLOWED_PREFIXES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.oasis.opendocument",
  "application/zip",
  "application/x-zip-compressed",
  "application/gzip",
  "application/x-tar",
  "application/x-7z-compressed",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "audio/",
  "video/",
];

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "txt",
  "csv",
  "md",
  "json",
  "zip",
  "gz",
  "tgz",
  "tar",
  "7z",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "heic",
  "mp3",
  "wav",
  "m4a",
  "mp4",
  "mov",
  "avi",
]);

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0 || idx === filename.length - 1) return "";
  return filename.slice(idx + 1).toLowerCase();
}

export function inferContentType(file: File): string {
  const rawType = file.type?.trim().toLowerCase() ?? "";
  const ext = getExtension(file.name);
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    md: "text/markdown",
    json: "application/json",
    zip: "application/zip",
    gz: "application/gzip",
    tar: "application/x-tar",
    "7z": "application/x-7z-compressed",
  };

  const inferred = map[ext];
  const genericTypes = new Set([
    "",
    "application/octet-stream",
    "binary/octet-stream",
    "application/unknown",
    "application/download",
  ]);

  if (genericTypes.has(rawType) && inferred) {
    return inferred;
  }

  return rawType || inferred || "application/octet-stream";
}

export function isAllowed(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) return false;
  const contentType = inferContentType(file);
  if (ALLOWED_PREFIXES.some((p) => contentType.startsWith(p))) return true;
  return ALLOWED_EXTENSIONS.has(getExtension(file.name));
}

export function fileIcon(contentType: string): typeof FileIcon {
  if (contentType.startsWith("image/")) return ImageIcon;
  if (contentType === "application/pdf") return FileText;
  if (contentType.startsWith("audio/")) return Music;
  if (contentType.startsWith("video/")) return Video;
  if (
    contentType.includes("spreadsheet") ||
    contentType.includes("excel") ||
    contentType === "text/csv"
  )
    return FileSpreadsheet;
  if (
    contentType.includes("presentation") ||
    contentType.includes("powerpoint")
  )
    return Presentation;
  if (
    contentType.includes("zip") ||
    contentType.includes("compressed") ||
    contentType.includes("tar") ||
    contentType.includes("gzip")
  )
    return ArchiveIcon;
  if (contentType.startsWith("text/") || contentType === "application/json")
    return FileText;
  return FileIcon;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Simulate an upload with progress. */
export function simulateUpload(
  attachment: Attachment,
  onUpdate: (id: string, patch: Partial<Attachment>) => void
) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 25 + 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      onUpdate(attachment.id, { progress: 100, status: "done" });
    } else {
      onUpdate(attachment.id, {
        progress: Math.round(progress),
        status: "uploading",
      });
    }
  }, 250);
}
