/**
 * Quick reply from search results (Issue #456).
 */

export interface QuickReplyState {
  isOpen: boolean;
  recipient: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  isSending: boolean;
  error: string | null;
}

export interface QuickReplyOptions {
  prefillBody?: boolean;
  includeQuote?: boolean;
  onSend?: (recipient: string, subject: string, body: string) => Promise<void>;
  onClose?: () => void;
}

export const DEFAULT_QUICK_REPLY_OPTIONS: QuickReplyOptions = {
  prefillBody: true,
  includeQuote: true,
};

export function createInitialQuickReplyState(recipient: string = "", subject: string = ""): QuickReplyState {
  return {
    isOpen: false,
    recipient,
    subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
    body: "",
    isSending: false,
    error: null,
  };
}

export function generateReplySubject(originalSubject: string): string {
  if (!originalSubject) return "Re: (no subject)";
  if (originalSubject.toLowerCase().startsWith("re:")) return originalSubject;
  return `Re: ${originalSubject}`;
}

export function generateQuotedBody(originalBody: string, senderName: string, date: string): string {
  const quoteHeader = `On ${date}, ${senderName} wrote:`;
  const quotedLines = originalBody.split("\n").map((line) => `> ${line}`).join("\n");
  return `\n\n${quoteHeader}\n${quotedLines}`;
}

export function validateQuickReply(state: QuickReplyState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!state.recipient.trim()) errors.push("Recipient is required");
  if (!state.subject.trim()) errors.push("Subject is required");
  if (!state.body.trim()) errors.push("Message body is required");
  return { valid: errors.length === 0, errors };
}

export function parseEmailAddress(input: string): string {
  const match = input.match(/<([^>]+)>/);
  return match ? match[1] : input.trim();
}

export function isQuickReplyShortcut(key: string): boolean {
  return key === "r";
}

export function formatRecipient(email: string, name?: string): string {
  if (name) return `${name} <${email}>`;
  return email;
}

export function sanitizeReplyBody(body: string): string {
  return body.split("\n").map((line) => {
    const quoteLevel = (line.match(/^>+/)?.[0]?.length || 0);
    if (quoteLevel > 3) return ">" + line.slice(quoteLevel);
    return line;
  }).join("\n");
}
