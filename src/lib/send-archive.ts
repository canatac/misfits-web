/**
 * send-archive.ts — send-then-archive helper.
 *
 * Encapsulates the "archive after send" behavior: determine whether a sent
 * message should be moved out of the inbox to the archive folder based on
 * user preference and sender context.
 */

export type ArchiveMode = "always" | "never" | "non-contacts";

export interface SendArchiveOptions {
  mode: ArchiveMode;
  /** Sender email of the message being sent. */
  fromEmail: string;
  /** When true, the recipient list contains only contacts. */
  allRecipientsAreContacts: boolean;
}

export interface ArchiveDecision {
  shouldArchive: boolean;
  reason: string;
}

/**
 * Decide whether to archive a message immediately after sending.
 */
export function shouldArchiveAfterSend(opts: SendArchiveOptions): ArchiveDecision {
  switch (opts.mode) {
    case "always":
      return { shouldArchive: true, reason: "mode=always" };
    case "never":
      return { shouldArchive: false, reason: "mode=never" };
    case "non-contacts":
      if (opts.allRecipientsAreContacts) {
        return { shouldArchive: false, reason: "all recipients are contacts" };
      }
      return { shouldArchive: true, reason: "has non-contact recipients" };
    default:
      return { shouldArchive: false, reason: "unknown mode" };
  }
}

/** Build the IMAP move-to-archive request payload. */
export function buildArchiveAction(messageId: string): {
  action: "move";
  destination: string;
  messageId: string;
} {
  return { action: "move", destination: "Archive", messageId };
}
