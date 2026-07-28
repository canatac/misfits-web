/**
 * Composer domain types for misfits.ai Mail.
 *
 * These describe the shape of the compose draft, recipients, attachments,
 * signatures, send options and validation results used across the composer
 * store, hooks and UI components.
 */

/** Recipient field kind. */
export type RecipientType = "to" | "cc" | "bcc";

/** A single recipient (email address + optional display name). */
export interface Recipient {
  /** Stable id (generated client-side). */
  id: string;
  /** Display name, if known from contacts. */
  name?: string;
  /** Email address. */
  email: string;
  /** Which field this recipient belongs to. */
  type: RecipientType;
  /** Avatar colour (hex) used for the chip fallback. */
  color?: string;
}

/** Composer attachment (client-side file handle + metadata). */
export interface Attachment {
  id: string;
  filename: string;
  /** MIME content type. */
  contentType: string;
  /** Size in bytes. */
  size: number;
  /** Object URL for preview (images) — revoked on remove. */
  previewUrl?: string;
  /** Upload progress 0–100. */
  progress: number;
  /** Upload state. */
  status: "pending" | "uploading" | "done" | "error";
  /** Error message when status === "error". */
  error?: string;
  /** The underlying File, kept for upload. */
  file?: File;
}

/** Send priority. */
export type Priority = "normal" | "high" | "low";

/** Options for sending an email. */
export interface SendOptions {
  /** ISO timestamp to send at a later time; undefined = send now. */
  sendLater?: string;
  /** Delivery priority. */
  priority?: Priority;
  /** Request a read receipt. */
  requestReadReceipt?: boolean;
}

/** Email signature (HTML). */
export interface EmailSignature {
  id: string;
  name: string;
  /** HTML body of the signature. */
  html: string;
  /** Whether this is the default signature. */
  isDefault?: boolean;
}

/** Persisted compose draft (a serialisable snapshot of the store). */
export interface ComposeDraft {
  id: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  /** HTML body. */
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  createdAt: string;
  updatedAt: string;
  /** Thread/In-Reply-To metadata for replies. */
  inReplyTo?: string;
  references?: string[];
}

/** Result of validating a recipient email address. */
export interface RecipientValidationResult {
  /** The address that was validated. */
  email: string;
  /** True when the format is a valid email. */
  valid: boolean;
  /** True when the domain appears to accept mail (MX check stub). */
  domainOk: boolean;
  /** True when the recipient is outside the misfits.ai domain. */
  external: boolean;
  /** Human-readable reason when invalid. */
  reason?: string;
}

/** Snapshot of the composer store for persistence/serialisation. */
export type ComposerState = ComposeDraft & {
  isFullScreen: boolean;
  isCompact: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  sending: boolean;
  sendError: string | null;
};
