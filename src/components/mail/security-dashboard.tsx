"use client";
import { useSecurityStore } from "@/stores/security-store";
import { useSecurityStats } from "@/hooks/use-security";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export function SecurityDashboard({ emails }: { emails: any[] }) {
  const results = useSecurityStore((s) => s.results);
  const stats = useSecurityStats();

  const suspicious = Object.entries(results)
    .filter(([, r]) => r.threatLevel === "dangerous" || r.threatLevel === "critical")
    .map(([id, r]) => ({ email: emails.find((e) => e.id === id), result: r }))
    .filter((x) => x.email)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold">Security</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(stats.stats).map(([level, count]) => (
          <div key={level} className="flex items-center justify-between rounded-md bg-[var(--color-muted)] px-2 py-1.5">
            <span className="text-xs capitalize">{level}</span>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </div>
      {suspicious.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-[var(--color-muted-fg)]">Threats</p>
          {suspicious.map(({ email, result }) => (
            <div key={email.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-muted)]">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="truncate text-xs">{email.subject}</span>
              <span className="ml-auto text-xs text-[var(--color-muted-fg)]">{result.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
