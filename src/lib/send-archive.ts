/**
 * Send & Archive combined action (Issue #481).
 *
 * Gmail-pattern combined action that sends a reply and archives the thread
 * in a single click. Reduces friction in inbox-zero workflows.
 */

export interface SendArchiveResult {
  sent: boolean;
  archived: boolean;
  threadId: string;
  timestamp: string;
  message: string;
}

export interface SendArchiveOptions {
  threadId: string;
  sendCallback: () => Promise<boolean>;
  archiveCallback: () => Promise<boolean>;
}

/**
 * Execute send & archive combined action.
 */
export async function executeSendAndArchive(
  options: SendArchiveOptions
): Promise<SendArchiveResult> {
  const { threadId, sendCallback, archiveCallback } = options;

  try {
    const sent = await sendCallback();
    if (!sent) {
      return {
        sent: false,
        archived: false,
        threadId,
        timestamp: new Date().toISOString(),
        message: "Failed to send email",
      };
    }

    const archived = await archiveCallback();

    return {
      sent: true,
      archived,
      threadId,
      timestamp: new Date().toISOString(),
      message: archived ? "Sent and archived" : "Sent (archive failed)",
    };
  } catch (error) {
    return {
      sent: false,
      archived: false,
      threadId,
      timestamp: new Date().toISOString(),
      message: `Error: ${(error as Error).message}`,
    };
  }
}

/**
 * Check if send & archive should be visible.
 */
export function shouldShowSendArchive(isReplying: boolean, isNewComposition: boolean): boolean {
  return isReplying && !isNewComposition;
}

/**
 * Get button label.
 */
export function getSendArchiveLabel(shortcut: boolean = false): string {
  return shortcut ? "Send & Archive ↵" : "Send & Archive";
}

/**
 * Get keyboard shortcut text.
 */
export function getSendArchiveShortcut(): string {
  return "Shift+Enter";
}

/**
 * Check if keyboard shortcut is triggered.
 */
export function isSendArchiveShortcut(event: KeyboardEvent): boolean {
  return event.key === "Enter" && event.shiftKey;
}

/**
 * Get toast message for result.
 */
export function getToastMessage(result: SendArchiveResult): string {
  if (result.sent && result.archived) {
    return "Sent and archived";
  }
  if (result.sent) {
    return "Sent";
  }
  return "Failed to send";
}

/**
 * Get toast variant for result.
 */
export function getToastVariant(result: SendArchiveResult): "success" | "warning" | "error" {
  if (result.sent && result.archived) return "success";
  if (result.sent) return "warning";
  return "error";
}
