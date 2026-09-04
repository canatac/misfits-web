/**
 * Email normalization helpers for UI consistency across providers.
 * - Decodes RFC 2047 encoded-word subjects (=?UTF-8?Q?...?= / B)
 * - Ensures attachment booleans are coherent with attachment arrays
 */
import type { Email } from "@/types/email";

const ENCODED_WORD_RE = /=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g;

function bytesFromQuotedPrintableHeader(input: string): Uint8Array {
  const normalized = input.replace(/_/g, " ");
  const out: number[] = [];
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === "=") {
      const h1 = normalized[i + 1];
      const h2 = normalized[i + 2];
      if (
        h1 &&
        h2 &&
        /[0-9a-fA-F]/.test(h1) &&
        /[0-9a-fA-F]/.test(h2)
      ) {
        out.push(Number.parseInt(`${h1}${h2}`, 16));
        i += 2;
        continue;
      }
    }
    out.push(ch.charCodeAt(0) & 0xff);
  }
  return new Uint8Array(out);
}

function bytesFromBase64Header(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, "");
  if (!cleaned) return new Uint8Array();
  const binary = atob(cleaned);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function decodeBytes(bytes: Uint8Array, charset: string): string {
  const cs = charset.trim().toLowerCase();
  const encodingMap: Record<string, string> = {
    "utf8": "utf-8",
    "utf-8": "utf-8",
    "iso-8859-1": "iso-8859-1",
    "latin1": "iso-8859-1",
    "latin-1": "iso-8859-1",
    "windows-1252": "windows-1252",
  };
  const encoding = encodingMap[cs] ?? cs;

  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    try {
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return String.fromCharCode(...Array.from(bytes));
    }
  }
}

export function decodeMimeHeaderValue(value: string): string {
  if (!value || !value.includes("=?")) return value;
  return value.replace(
    ENCODED_WORD_RE,
    (full: string, charset: string, encoding: string, text: string) => {
      try {
        const bytes = /b/i.test(encoding)
          ? bytesFromBase64Header(text)
          : bytesFromQuotedPrintableHeader(text);
        return decodeBytes(bytes, charset);
      } catch {
        return full;
      }
    }
  );
}

export function normalizeEmailRecord(email: Email): Email {
  const attachments = Array.isArray(email.attachments) ? email.attachments : [];
  return {
    ...email,
    subject: decodeMimeHeaderValue(email.subject ?? ""),
    attachments,
    hasAttachments: Boolean(email.hasAttachments || attachments.length > 0),
  };
}
