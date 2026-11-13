"use client";

import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { useSecuritySettingsStore } from "@/stores/security-settings-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SensitivityLevel } from "@/lib/phishing-scanner";

export function PhishingAuditLog() {
  const auditLog = useSecuritySettingsStore((s) => s.phishingAuditLog);
  const clearLog = useSecuritySettingsStore((s) => s.clearPhishingAuditLog);
  const sensitivity = useSecuritySettingsStore((s) => s.phishingSensitivity);
  const setSensitivity = useSecuritySettingsStore((s) => s.setPhishingSensitivity);

  return (
    <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-[#71717A] uppercase">Phishing Detection</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A1A1AA]">Sensitivity:</span>
          <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as SensitivityLevel)}>
            <SelectTrigger className="w-28" data-testid="phishing-sensitivity-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {auditLog.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[#A1A1AA]">
          <Shield className="h-4 w-4" />
          No phishing detections recorded yet.
        </div>
      ) : (
        <div className="space-y-2" data-testid="phishing-audit-log">
          {auditLog.map((entry, i) => (
            <div key={`${entry.emailId}-${i}`} className="flex items-center gap-3 rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-xs">
              <AlertTriangle className={entry.threatLevel === "high" ? "h-3 w-3 text-red-400" : "h-3 w-3 text-amber-400"} />
              <span className="flex-1 truncate text-[#E0E0E0]">{entry.subject}</span>
              <span className="text-[#A1A1AA]">{entry.from}</span>
              <span className={entry.threatLevel === "high" ? "text-red-400" : "text-amber-400"}>{entry.threatLevel}</span>
              <span className="text-[#71717A]">{new Date(entry.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          ))}
        </div>
      )}
      {auditLog.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearLog} className="mt-3 gap-1 text-[#A1A1AA]">
          <Trash2 className="h-3 w-3" /> Clear log
        </Button>
      )}
    </div>
  );
}
