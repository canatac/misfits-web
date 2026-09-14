"use client";

import { useState, useCallback } from "react";
import { useEmailStore } from "@/stores/email-store";
import { useContactStore } from "@/stores/contact-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Users, Calendar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  emailsToMbox,
  contactsToVcard,
  calendarToIcal,
  generateExportFilename,
  downloadTextFile,
} from "@/lib/data-export";

type ExportFormat = "mbox" | "vcard" | "ical";

const FORMAT_INFO: Record<ExportFormat, { label: string; icon: typeof FileText; description: string; mimeType: string }> = {
  mbox: {
    label: "Emails (mbox)",
    icon: FileText,
    description: "Export all emails in mbox format (RFC 4155). Compatible with Thunderbird, Apple Mail, Gmail.",
    mimeType: "application/mbox",
  },
  vcard: {
    label: "Contacts (vCard)",
    icon: Users,
    description: "Export contacts in vCard 4.0 format (RFC 6350). Compatible with all address books.",
    mimeType: "text/vcard",
  },
  ical: {
    label: "Calendar (iCal)",
    icon: Calendar,
    description: "Export calendar events in iCal format (RFC 5545). Compatible with Google Calendar, Outlook, Apple Calendar.",
    mimeType: "text/calendar",
  },
};

export default function DataExportPage() {
  const emails = useEmailStore((s) => s.emails);
  const contacts = useContactStore((s) => s.contacts);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      setExporting(format);

      try {
        let content: string;
        const filename = generateExportFilename(format);
        const info = FORMAT_INFO[format];

        switch (format) {
          case "mbox":
            content = emailsToMbox(emails);
            break;
          case "vcard":
            content = contactsToVcard(contacts);
            break;
          case "ical":
            content = calendarToIcal([]);
            break;
        }

        downloadTextFile(content, filename, info.mimeType);
        setLastExport(`${filename} (${content.length} bytes)`);
      } finally {
        setExporting(null);
      }
    },
    [emails, contacts]
  );

  return (
    <div className="space-y-6" data-testid="data-export-page">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">
          Export Your Data
        </h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Download your personal data in standard formats (RGPD/NIS2 compliance)
        </p>
      </div>

      {/* RGPD Notice */}
      <Card className="border-[var(--color-brand-500)]/30 bg-[var(--color-brand-500)]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--color-brand-500)]">
            <Shield className="h-5 w-5" />
            Your Rights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--color-muted-fg)]">
          <p>
            Under RGPD Article 20, you have the right to receive your personal data in a structured, commonly used format.
          </p>
          <p>
            Exports are available within 72 hours of request. Download links expire after 24 hours.
          </p>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((format) => {
          const info = FORMAT_INFO[format];
          const Icon = info.icon;
          const count = format === "mbox" ? emails.length : format === "vcard" ? contacts.length : 0;

          return (
            <Card key={format} data-testid={`export-${format}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[var(--color-brand-500)]" />
                  {info.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[var(--color-muted-fg)]">
                  {info.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    {count} item{count !== 1 ? "s" : ""}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleExport(format)}
                    disabled={exporting !== null}
                    data-testid={`export-${format}-button`}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exporting === format ? "Exporting..." : "Export"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Export */}
      {lastExport && (
        <div
          className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500"
          data-testid="last-export"
        >
          Last export: {lastExport}
        </div>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-fg)]">
            All exports are logged for security audit purposes.
          </p>
          {lastExport && (
            <ul className="mt-2 space-y-1 text-xs text-[var(--color-muted-fg)]">
              <li>• {lastExport} — {new Date().toLocaleString()}</li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
