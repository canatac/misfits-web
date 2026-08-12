import { format, parseISO } from "date-fns";

export function displayNullable(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function formatLocalTimestamp(ts: string | null | undefined): string {
  if (!ts) return "—";
  try {
    return format(parseISO(ts), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return "—";
  }
}

export function riskTextClass(risk: number | null | undefined): string {
  if (risk === null || risk === undefined)
    return "text-[var(--color-muted-fg)]";
  if (risk < 20) return "text-[var(--color-success-600)]";
  if (risk <= 50) return "text-[var(--color-warning-600)]";
  return "text-[var(--color-danger-600)]";
}

export function eventTypeClass(eventType: string): string {
  switch (eventType) {
    case "delivered":
      return "border-l-[var(--color-success-500)] bg-[var(--color-success-50)]/40";
    case "bounced":
      return "border-l-[var(--color-danger-500)] bg-[var(--color-danger-50)]/40";
    case "deferred":
      return "border-l-[var(--color-warning-500)] bg-[var(--color-warning-50)]/40";
    case "tls_ok":
      return "border-l-[var(--color-info-500)] bg-[var(--color-info-50)]/40";
    default:
      return "border-l-[var(--color-border)]";
  }
}
