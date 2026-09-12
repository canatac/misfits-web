import { describe, expect, it } from "vitest";
import { exportChat, toHtml, toMarkdown, type ChatExport } from "@/lib/ai-chat-export";

const chat: ChatExport = {
  title: "Test Chat",
  exportedAt: 0,
  messages: [
    { role: "user", content: "Hello", timestamp: 1000 },
    { role: "assistant", content: "Hi!", timestamp: 2000 },
  ],
};

describe("ai-chat-export", () => {
  it("exports Markdown with headers", () => {
    const md = toMarkdown(chat);
    expect(md).toContain("# Test Chat");
    expect(md).toContain("**User**");
    expect(md).toContain("**Assistant**");
    expect(md).toContain("Hello");
  });

  it("exports HTML with escaped content", () => {
    const html = toHtml({ ...chat, messages: [{ role: "user", content: "<script>", timestamp: 1 }] });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("exportChat dispatches by format", () => {
    expect(exportChat(chat, "markdown")).toContain("# Test Chat");
    expect(exportChat(chat, "html")).toContain("<h1>");
  });
});
