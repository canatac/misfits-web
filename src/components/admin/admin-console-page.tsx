"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Activity, ShieldCheck, Clock3 } from "lucide-react";
import {
  useMonitoringAlerts,
  useMonitoringBounces,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary,
} from "@/hooks/use-monitoring";
import {
  useSecurityActiveAlerts,
  useSecurityIncidents,
  useSecurityLive,
} from "@/hooks/use-security-dashboard";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import { cn } from "@/lib/utils";

type AdminTab =
  "overview" | "monitoring" | "security" | "changelog" | "change-requests";

const WINDOW_OPTIONS: MonitoringWindow[] = ["15m", "1h", "6h", "24h", "7d"];
const SEVERITY_OPTIONS: Array<SecuritySeverity | "all"> = [
  "all",
  "info",
  "low",
  "medium",
  "high",
  "critical",
];

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function asInt(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    value
  );
}

function asDate(ts: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "warn" | "ok";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        tone === "neutral" && "border-[#313136] bg-[#1B1B1F] text-[#CFCFD4]",
        tone === "danger" && "border-[#5B1F27] bg-[#2B1419] text-[#FCA5A5]",
        tone === "warn" && "border-[#5E4A20] bg-[#2B2413] text-[#FCD34D]",
        tone === "ok" && "border-[#1F4B3E] bg-[#10281F] text-[#86EFAC]"
      )}
    >
      {children}
    </span>
  );
}

export function AdminConsolePage({
  initialTab = "overview",
}: {
  initialTab?: AdminTab;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [windowRange, setWindowRange] = useState<MonitoringWindow>("24h");
  const [severity, setSeverity] = useState<SecuritySeverity | "all">("all");

  const monitoringSummary = useMonitoringSummary(windowRange);
  const monitoringAlerts = useMonitoringAlerts(windowRange);
  const monitoringProviders = useMonitoringProviders(windowRange);
  const monitoringBounces = useMonitoringBounces(windowRange);
  const monitoringLive = useMonitoringLive({
    enabled: activeTab !== "changelog",
  });

  const securitySeverityFilter = severity === "all" ? undefined : severity;
  const securityActive = useSecurityActiveAlerts({
    window: windowRange,
    severity: securitySeverityFilter,
  });
  const securityIncidents = useSecurityIncidents({
    page: 1,
    page_size: 20,
    severity: securitySeverityFilter,
  });
  const securityLive = useSecurityLive({ enabled: activeTab !== "changelog" });

  const summaryCards = useMemo(() => {
    const summary = monitoringSummary.data;
    const activeMonAlerts = monitoringAlerts.data?.alerts?.length ?? 0;
    const activeSecAlerts = securityActive.data?.alerts?.length ?? 0;

    return [
      {
        label: "Delivery rate",
        value: summary ? percent(summary.delivery_rate) : "—",
        note: "Emails livrés",
        icon: Activity,
      },
      {
        label: "Bounce rate",
        value: summary ? percent(summary.bounce_rate) : "—",
        note: "Hard + soft bounce",
        icon: AlertTriangle,
      },
      {
        label: "Alertes Monitoring",
        value: asInt(activeMonAlerts),
        note: `Fenêtre ${windowRange}`,
        icon: Clock3,
      },
      {
        label: "Alertes Sécurité",
        value: asInt(activeSecAlerts),
        note: severity === "all" ? "Toutes sévérités" : severity,
        icon: ShieldCheck,
      },
    ] as const;
  }, [
    monitoringAlerts.data,
    monitoringSummary.data,
    securityActive.data,
    severity,
    windowRange,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
      <header className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[#F4F4F5]">
              Console Admin
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              Monitoring SMTP, sécurité anti-phishing, incidents, change
              requests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setWindowRange(opt)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  windowRange === opt
                    ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                    : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
                )}
              >
                {opt}
              </button>
            ))}
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as SecuritySeverity | "all")
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-2.5 py-1 text-xs text-[#D4D4D8]"
              aria-label="Filtrer la sévérité sécurité"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  severity: {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Vue globale"],
              ["monitoring", "Monitoring SMTP"],
              ["security", "Sécurité"],
              ["changelog", "Changelog"],
              ["change-requests", "Change requests"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                activeTab === key
                  ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                  : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {(activeTab === "overview" ||
        activeTab === "monitoring" ||
        activeTab === "security") && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[#A1A1AA]">{card.label}</span>
                <card.icon className="h-4 w-4 text-[#C49B66]" />
              </div>
              <p className="text-2xl font-semibold text-[#F4F4F5]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#71717A]">{card.note}</p>
            </article>
          ))}
        </section>
      )}

      {(activeTab === "overview" || activeTab === "monitoring") && (
        <section className="grid gap-3 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
            <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
              Top providers
            </h2>
            <div className="space-y-2">
              {(monitoringProviders.data?.providers ?? [])
                .slice(0, 8)
                .map((provider, idx) => (
                  <div
                    key={`${provider.company ?? "unknown"}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-[#E4E4E7]">
                        {provider.company ??
                          provider.datacenter ??
                          "Unknown provider"}
                      </p>
                      <p className="text-xs text-[#71717A]">
                        {provider.country ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#E4E4E7]">
                        {asInt(provider.count)} events
                      </p>
                      <p className="text-xs text-[#71717A]">
                        avg {Math.round(provider.avg_total_ms)} ms
                      </p>
                    </div>
                  </div>
                ))}
              {!monitoringProviders.data?.providers?.length && (
                <p className="text-sm text-[#71717A]">
                  Aucune donnée provider pour la fenêtre sélectionnée.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
            <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
              Bounces (récentes)
            </h2>
            <div className="space-y-2">
              {(monitoringBounces.data?.bounces ?? [])
                .slice(0, 8)
                .map((bounce) => (
                  <div
                    key={bounce.id}
                    className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-[#D4D4D8]">
                        {bounce.to}
                      </p>
                      <Badge
                        tone={bounce.bounce_type === "hard" ? "danger" : "warn"}
                      >
                        {bounce.bounce_type ?? "bounce"}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[#71717A]">
                      {bounce.bounce_reason ?? "No reason provided"}
                    </p>
                  </div>
                ))}
              {!monitoringBounces.data?.bounces?.length && (
                <p className="text-sm text-[#71717A]">
                  Aucun bounce sur la fenêtre sélectionnée.
                </p>
              )}
            </div>
          </article>
        </section>
      )}

      {(activeTab === "overview" || activeTab === "security") && (
        <section className="grid gap-3 xl:grid-cols-2">
          <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
            <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
              Alertes sécurité actives
            </h2>
            <div className="space-y-2">
              {(securityActive.data?.alerts ?? []).slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#E4E4E7]">{alert.rule_name}</p>
                    <Badge
                      tone={
                        alert.severity === "critical" ||
                        alert.severity === "high"
                          ? "danger"
                          : alert.severity === "medium"
                            ? "warn"
                            : "ok"
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#71717A]">
                    {alert.tenant_id ?? "global"} · confidence{" "}
                    {Math.round(alert.confidence * 100)}% · {asDate(alert.ts)}
                  </p>
                </div>
              ))}
              {!securityActive.data?.alerts?.length && (
                <p className="text-sm text-[#71717A]">
                  Aucune alerte active pour ce filtre.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
            <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
              Incidents (historique récent)
            </h2>
            <div className="space-y-2">
              {(securityIncidents.data?.alerts ?? [])
                .slice(0, 10)
                .map((incident) => (
                  <div
                    key={incident.id}
                    className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#E4E4E7]">
                        {incident.rule_name}
                      </p>
                      <Badge tone={incident.rolled_back ? "ok" : "neutral"}>
                        {incident.rolled_back ? "rolled back" : incident.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#71717A]">
                      action {incident.action} · level{" "}
                      {incident.remediation_level} · {asDate(incident.ts)}
                    </p>
                  </div>
                ))}
              {!securityIncidents.data?.alerts?.length && (
                <p className="text-sm text-[#71717A]">
                  Aucun incident sur ce filtre.
                </p>
              )}
            </div>
          </article>
        </section>
      )}

      {(activeTab === "overview" || activeTab === "monitoring") && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#E4E4E7]">
              Live monitoring stream
            </h2>
            <Badge tone={monitoringLive.isConnected ? "ok" : "warn"}>
              {monitoringLive.isConnected ? "connected" : "disconnected"}
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {monitoringLive.events.slice(0, 9).map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
              >
                <p className="text-xs text-[#A1A1AA]">{evt.event_type}</p>
                <p className="truncate text-sm text-[#E4E4E7]">{evt.to}</p>
                <p className="mt-1 text-xs text-[#71717A]">{asDate(evt.ts)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(activeTab === "overview" || activeTab === "security") && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#E4E4E7]">
              Live security stream
            </h2>
            <Badge tone={securityLive.isConnected ? "ok" : "warn"}>
              {securityLive.isConnected ? "connected" : "disconnected"}
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {securityLive.alerts.slice(0, 9).map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
              >
                <p className="text-xs text-[#A1A1AA]">{alert.rule_id}</p>
                <p className="truncate text-sm text-[#E4E4E7]">
                  {alert.rule_name}
                </p>
                <p className="mt-1 text-xs text-[#71717A]">
                  {asDate(alert.ts)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "changelog" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <h2 className="text-sm font-semibold text-[#E4E4E7]">
            Changelog Admin
          </h2>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Écran prêt côté frontend. Brancher une source backend
            `admin.changelog` pour afficher les releases, migrations et
            incidents marquants (voir contrat backend ci-dessous dans le PR).
          </p>
        </section>
      )}

      {activeTab === "change-requests" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <h2 className="text-sm font-semibold text-[#E4E4E7]">
            Change Requests
          </h2>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Écran prêt côté frontend. Brancher une source backend
            `admin.change_requests` pour piloter les demandes, approbations et
            rollbacks.
          </p>
        </section>
      )}
    </div>
  );
}
