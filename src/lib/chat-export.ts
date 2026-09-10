/**
 * AI Chat Export (Issue #483).
 *
 * Provides export functionality for AI chat conversations:
 * - Markdown export (.md file download)
 * - PDF export (via print dialog)
 * - Copy to clipboard (plain text)
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  references?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportOptions {
  includeTimestamps: boolean;
  includeReferences: boolean;
  title?: string;
}

/**
 * Export conversation as Markdown.
 */
export function exportAsMarkdown(
  conversation: ChatConversation,
  options: ExportOptions = { includeTimestamps: true, includeReferences: true }
): string {
  const title = options.title || conversation.title || "Hermes Chat";
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`*Exported on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}*`);
  lines.push("");

  for (const message of conversation.messages) {
    const roleLabel = message.role === "user" ? "**You**" : message.role === "assistant" ? "**Hermes**" : "**System**";

    if (options.includeTimestamps) {
      const timestamp = new Date(message.timestamp).toLocaleString();
      lines.push(`> ${roleLabel} _(${timestamp})_`);
    } else {
      lines.push(`> ${roleLabel}`);
    }

    lines.push("");
    lines.push(message.content);
    lines.push("");

    if (options.includeReferences && message.references && message.references.length > 0) {
      lines.push("**References:**");
      for (const ref of message.references) {
        lines.push(`- ${ref}`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Export conversation as plain text (for clipboard).
 */
export function exportAsPlainText(
  conversation: ChatConversation,
  options: ExportOptions = { includeTimestamps: true, includeReferences: false }
): string {
  const title = options.title || conversation.title || "Hermes Chat";
  const lines: string[] = [];

  lines.push(title);
  lines.push("=".repeat(title.length));
  lines.push("");

  for (const message of conversation.messages) {
    const roleLabel = message.role === "user" ? "You" : message.role === "assistant" ? "Hermes" : "System";

    if (options.includeTimestamps) {
      const timestamp = new Date(message.timestamp).toLocaleString();
      lines.push(`[${timestamp}] ${roleLabel}:`);
    } else {
      lines.push(`${roleLabel}:`);
    }

    lines.push(message.content);
    lines.push("");

    if (options.includeReferences && message.references && message.references.length > 0) {
      lines.push("References:");
      for (const ref of message.references) {
        lines.push(`  - ${ref}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Download conversation as Markdown file.
 */
export function downloadAsMarkdown(
  conversation: ChatConversation,
  options?: ExportOptions
): void {
  const markdown = exportAsMarkdown(conversation, options);
  const filename = generateFilename(conversation, "md");
  downloadTextFile(markdown, filename, "text/markdown");
}

/**
 * Download conversation as plain text file.
 */
export function downloadAsText(
  conversation: ChatConversation,
  options?: ExportOptions
): void {
  const text = exportAsPlainText(conversation, options);
  const filename = generateFilename(conversation, "txt");
  downloadTextFile(text, filename, "text/plain");
}

/**
 * Copy conversation to clipboard.
 */
export async function copyToClipboard(
  conversation: ChatConversation,
  options?: ExportOptions
): Promise<boolean> {
  const text = exportAsPlainText(conversation, options);

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Print conversation (for PDF export).
 */
export function printConversation(
  conversation: ChatConversation,
  options?: ExportOptions
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const title = options?.title || conversation.title || "Hermes Chat";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .user { background: #f0f0f0; }
    .assistant { background: #e8f4f8; }
    .system { background: #fff3cd; }
    .role { font-weight: bold; margin-bottom: 5px; }
    .timestamp { font-size: 0.85em; color: #666; }
    .references { margin-top: 10px; font-size: 0.9em; }
    .references a { color: #0066cc; }
    hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><em>Exported on ${new Date().toLocaleDateString()}</em></p>
  <hr>
  ${conversation.messages.map((msg) => {
    const roleClass = msg.role;
    const roleLabel = msg.role === "user" ? "You" : msg.role === "assistant" ? "Hermes" : "System";
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const refs = msg.references && msg.references.length > 0
      ? `<div class="references"><strong>References:</strong><br>${msg.references.map((r) => `<a href="${r}">${r}</a>`).join("<br>")}</div>`
      : "";
    return `<div class="message ${roleClass}">
      <div class="role">${roleLabel} <span class="timestamp">(${timestamp})</span></div>
      <div>${msg.content.replace(/\n/g, "<br>")}</div>
      ${refs}
    </div>`;
  }).join("<hr>")}
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Generate filename for export.
 */
export function generateFilename(
  conversation: ChatConversation,
  extension: string
): string {
  const date = new Date().toISOString().slice(0, 10);
  const title = conversation.title
    ? conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)
    : "chat";
  return `hermes-chat-${title}-${date}.${extension}`;
}

/**
 * Download text content as a file.
 */
function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get conversation statistics.
 */
export function getConversationStats(conversation: ChatConversation): {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalCharacters: number;
  referencesCount: number;
} {
  return {
    totalMessages: conversation.messages.length,
    userMessages: conversation.messages.filter((m) => m.role === "user").length,
    assistantMessages: conversation.messages.filter((m) => m.role === "assistant").length,
    totalCharacters: conversation.messages.reduce((sum, m) => sum + m.content.length, 0),
    referencesCount: conversation.messages.reduce((sum, m) => sum + (m.references?.length || 0), 0),
  };
}
