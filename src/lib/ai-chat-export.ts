/**
 * ai-chat-export.ts — export AI chat conversations.
 *
 * Serializes a chat transcript into Markdown or a printable HTML blob that
 * the browser can download. Each message is labeled with role + timestamp.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatExport {
  title: string;
  messages: ChatMessage[];
  exportedAt: number;
}

export type ExportFormat = "markdown" | "html";

function roleLabel(role: ChatMessage["role"]): string {
  switch (role) {
    case "user": return "**User**";
    case "assistant": return "**Assistant**";
    case "system": return "*System*";
  }
}

function tsToDate(ts: number): string {
  return new Date(ts).toISOString();
}

export function toMarkdown(chat: ChatExport): string {
  const lines = [`# ${chat.title}`, `_Exported ${tsToDate(chat.exportedAt)}_`, ""];
  for (const m of chat.messages) {
    lines.push(`## ${roleLabel(m.role)} — ${tsToDate(m.timestamp)}`);
    lines.push(m.content, "");
  }
  return lines.join("\n");
}

export function toHtml(chat: ChatExport): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const msgs = chat.messages.map((m) => {
    return `<div class="msg ${escape(m.role)}">
  <div class="meta">${escape(roleLabel(m.role))} - ${escape(tsToDate(m.timestamp))}</div>
  <pre>${escape(m.content)}</pre>
</div>`;
  }).join("\n");

  return `<!doctype html><html><head><title>${escape(chat.title)}</title></head>
<body><h1>${escape(chat.title)}</h1>
<small>Exported ${escape(tsToDate(chat.exportedAt))}</small>
${msgs}</body></html>`;
}

export function exportChat(chat: ChatExport, format: ExportFormat): string {
  return format === "markdown" ? toMarkdown(chat) : toHtml(chat);
}

/** Trigger a browser download of the exported content. */
export function downloadExport(chat: ChatExport, format: ExportFormat): void {
  const content = exportChat(chat, format);
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return;
  const mime = format === "markdown" ? "text/markdown" : "text/html";
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chat.title.replace(/\s+/g, "_")}.${format === "markdown" ? "md" : "html"}`;
  a.click();
  URL.revokeObjectURL(url);
}
