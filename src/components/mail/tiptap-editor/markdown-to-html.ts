/** Minimal markdown → HTML for common inline/block constructs. */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;
  let inOrdered = false;
  let inQuote = false;
  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (inOrdered) {
      html.push("</ol>");
      inOrdered = false;
    }
  };
  const closeQuote = () => {
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1}\s+/.test(line)) {
      closeList();
      closeQuote();
      html.push(`<h1>${inline(line.replace(/^#{1}\s+/, ""))}</h1>`);
    } else if (/^#{2}\s+/.test(line)) {
      closeList();
      closeQuote();
      html.push(`<h2>${inline(line.replace(/^#{2}\s+/, ""))}</h2>`);
    } else if (/^>\s?/.test(line)) {
      closeList();
      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }
      html.push(`<p>${inline(line.replace(/^>\s?/, ""))}</p>`);
    } else if (/^[-*]\s+/.test(line)) {
      closeQuote();
      if (inOrdered) {
        html.push("</ol>");
        inOrdered = false;
      }
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      closeQuote();
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      if (!inOrdered) {
        html.push("<ol>");
        inOrdered = true;
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      closeList();
      closeQuote();
    } else {
      closeList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  closeQuote();
  return html.join("");
}
