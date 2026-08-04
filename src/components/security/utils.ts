import type { SecurityActionType, SecuritySeverity } from "@/types/security";

export function securitySeverityClass(severity: SecuritySeverity): string {
  switch (severity) {
    case "critical":
      return "bg-[var(--color-danger-500)] text-white animate-pulse";
    case "high":
      return "bg-[var(--color-danger-100)] text-[var(--color-danger-700)]";
    case "medium":
      return "bg-[var(--color-warning-100)] text-[var(--color-warning-800)]";
    case "low":
      return "bg-[var(--color-info-100)] text-[var(--color-info-800)]";
    case "info":
    default:
      return "bg-[var(--color-muted)] text-[var(--color-muted-fg)]";
  }
}

export function actionIcon(action: SecurityActionType): string {
  switch (action) {
    case "alert":
      return "🔔";
    case "throttle":
      return "🐢";
    case "quarantine":
      return "📦";
    case "block":
      return "🚫";
    case "human_challenge":
      return "👤";
    default:
      return "🛡";
  }
}

export function formatIsoLocal(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
