/**
 * Email Export as PDF/Print
 *
 * Generates PDF or print-ready version of emails:
 * - Strips UI elements for clean output
 * - Formats headers (from, to, date, subject)
 * - Handles attachments list
 * - Responsive print stylesheet
 */

export interface ExportOptions {
  includeAttachments: boolean;
  includeHeaders: boolean;
  format: 'pdf' | 'print';
}

export interface ExportData {
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  attachments?: Array<{ name: string; size: number }>;
}

const defaultOptions: ExportOptions = {
  includeAttachments: true,
  includeHeaders: true,
  format: 'pdf',
};

export function generatePrintHtml(data: ExportData, options: Partial<ExportOptions> = {}): string {
  const opts = { ...defaultOptions, ...options };
  let html = '<div class="email-print">';

  if (opts.includeHeaders) {
    html += '<div class="email-headers">';
    html += `<p><strong>From:</strong> ${escapeHtml(data.from)}</p>`;
    html += `<p><strong>To:</strong> ${escapeHtml(data.to)}</p>`;
    html += `<p><strong>Date:</strong> ${escapeHtml(data.date)}</p>`;
    html += `<p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>`;
    html += '</div><hr/>';
  }

  html += `<div class="email-body">${data.body}</div>`;

  if (opts.includeAttachments && data.attachments?.length) {
    html += '<div class="email-attachments"><h3>Attachments</h3><ul>';
    for (const att of data.attachments) {
      html += `<li>${escapeHtml(att.name)} (${formatSize(att.size)})</li>`;
    }
    html += '</ul></div>';
  }

  html += '</div>';
  return html;
}

export function printEmail(html: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<html><head><title>Print</title></head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.print();
}

export function generateFilename(data: ExportData): string {
  const cleanSubject = data.subject.replace(/[^a-z0-9]/gi, '_').slice(0, 50);
  return `email_${cleanSubject}_${Date.now()}`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
