"use client";
import React from "react";

// AdminOverviewSections.tsx — extracted Sprint 3
// Shared diagnostic sections for overview / monitoring / security tabs
import type { SecurityAlert } from "@/types/security";
import { cn } from "@/lib/utils";
import { Badge, asDate, asInt, percent } from "../shared";

type ActiveTabScope = "overview" | "monitoring" | "security";

export type LocalSecurityPosture = {
  threat_events?: number;
  auth_failures_total?: number;
  suspicious_ips_count?: number;
  blocked_events?: number;
  alerts?: Array<{
    id: string; severity: string; title: string; description: string;
    at: string; remediation?: string;
  }>;
  ip_reputation?: Array<{
    ip: string; risk_score: number; is_blocked: boolean; last_seen_at: string;
  }>;
  security?: {
    tls?: {
      smtp_starttls_required?: boolean;
      smtps_listener?: string;
      imaps_listener?: string;
    };
    authentication?: {
      sasl_mechanisms?: string[];
      oauth2_enabled?: boolean;
      admin_mfa_required?: boolean;
    };
    anti_abuse?: {
      rate_limit_enabled?: boolean;
      rate_limit_per_minute?: number;
      fail2ban_enabled?: boolean;
      bruteforce_signals_24h?: number;
      auth_policy_signals_24h?: number;
    };
    mail_auth_dns?: {
      domain?: string; spf_expected?: string;
      dkim_selector?: string; dmarc_expected?: string; ptr_rdns_note?: string;
    };
  };
};

type LocalDeliverabilityDiag = {
  total_events?: number;
  bounces_total?: number;
  auth_policy_alerts?: number;
  spf?: { failures?: number; failure_rate?: number };
  dkim?: { failures?: number; failure_rate?: number };
  dmarc?: { failures?: number; failure_rate?: number };
  reputation?: { avg_risk_score?: number; high_risk_events?: number; ip_domain_status?: string };
  top_bounce_reasons?: Array<{ reason: string; count: number }>;
  rbl?: { sources?: string[]; listed_by?: string[]; status?: string };
};

type LocalObservabilityOverview = {
  smtp?: { total_events?: number; failure_events?: number; p95_total_ms?: number };
  health_realtime?: {
    queue?: { depth?: number; oldest_age_seconds?: number | null };
    throughput?: { incoming_per_min?: number; outgoing_per_min?: number };
    delivery?: { success_rate?: number; smtp_4xx_rate?: number; smtp_5xx_rate?: number; p95_total_ms?: number };
  };
};

interface SummaryCard {
  label: string; value: string | number; note: string;
  icon: React.ElementType;
}

interface AdminOverviewSectionsProps {
  activeTab: ActiveTabScope;
  observability: LocalObservabilityOverview | null;
  securityPosture: LocalSecurityPosture | null;
  deliverability: LocalDeliverabilityDiag | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
  securityLive: { isConnected: boolean; alerts: SecurityAlert[] };
  assistantLoading: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  assistantAnswer: string;
  assistantError: string | null;
  askHermesForAdminPlan: () => void;
  summaryCards: readonly SummaryCard[];
}

export function AdminOverviewSections({
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
  securityLive,
  assistantLoading,
  assistantPrompt,
  setAssistantPrompt,
  assistantAnswer,
  assistantError,
  askHermesForAdminPlan,
  summaryCards,
}: AdminOverviewSectionsProps) {
  return (
    <>
  {(activeTab === "overview" ||
    activeTab === "monitoring" ||
    activeTab === "security") && (
    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#E4E4E7]">
          Assistant Hermes — administration serveur
        </h2>
        <Badge tone={assistantLoading ? "warn" : "ok"}>
          {assistantLoading ? "analyse…" : "prêt"}
        </Badge>
      </div>
      <p className="mb-3 text-xs text-[#A1A1AA]">
        Décris ton besoin (résumé incident, plan d’action, priorisation) et
        Hermes te renvoie un résumé + une checklist d’actions à exécuter.
      </p>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void askHermesForAdminPlan();
        }}
      >
        <textarea
          value={assistantPrompt}
          onChange={(event) => setAssistantPrompt(event.target.value)}
          placeholder="Ex: Résume la situation et propose les actions P0/P1 pour stabiliser SMTP/IMAP dans les 2h."
          className="min-h-[96px] w-full rounded-xl border border-[#2B2B31] bg-[#151518] px-3 py-2 text-sm text-[#E4E4E7] outline-none placeholder:text-[#71717A] focus:border-[#C49B66]"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={assistantLoading}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium",
              assistantLoading
                ? "cursor-not-allowed border-[#3A3A42] bg-[#1B1B1F] text-[#71717A]"
                : "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7] hover:bg-[#312718]"
            )}
          >
            {assistantLoading ? "Hermes réfléchit…" : "Demander à Hermes"}
          </button>
          {assistantError && (
            <span className="text-xs text-[#FCA5A5]">{assistantError}</span>
          )}
        </div>
      </form>

      <div className="mt-3 rounded-xl border border-[#232327] bg-[#151518] p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-[#A1A1AA] uppercase">
          Réponse Hermes
        </p>
        {assistantAnswer ? (
          <pre className="text-xs leading-relaxed break-words whitespace-pre-wrap text-[#D4D4D8]">
            {assistantAnswer}
          </pre>
        ) : (
          <p className="text-xs text-[#71717A]">
            Aucune réponse pour le moment.
          </p>
        )}
      </div>
    </section>
  )}

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

  {(activeTab === "overview" ||
    activeTab === "monitoring" ||
    activeTab === "security") && (
    <section className="grid gap-3 xl:grid-cols-3">
      <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
        <h2 className="mb-2 text-sm font-semibold text-[#E4E4E7]">
          Sécurité renforcée
        </h2>
        <p className="text-xs text-[#71717A]">
          TLS obligatoire, auth forte et anti-abus.
        </p>
        <div className="mt-3 space-y-2 text-xs text-[#D4D4D8]">
          <p>
            STARTTLS SMTP:{" "}
            {securityPosture?.security?.tls?.smtp_starttls_required
              ? "required"
              : "optional"}
          </p>
          <p>
            SMTPS: {securityPosture?.security?.tls?.smtps_listener ?? "—"}
          </p>
          <p>
            IMAPS: {securityPosture?.security?.tls?.imaps_listener ?? "—"}
          </p>
          <p>
            Auth:{" "}
            {(
              securityPosture?.security?.authentication
                ?.sasl_mechanisms ?? ["PLAIN", "LOGIN"]
            ).join(" + ")}
            {securityPosture?.security?.authentication?.oauth2_enabled
              ? " + OAuth2"
              : ""}
          </p>
          <p>
            MFA admin:{" "}
            {securityPosture?.security?.authentication?.admin_mfa_required
              ? "required"
              : "not enforced"}
          </p>
          <p>
            Rate limiting:{" "}
            {securityPosture?.security?.anti_abuse?.rate_limit_enabled
              ? `on (${securityPosture.security.anti_abuse?.rate_limit_per_minute ?? "?"}/min)`
              : "off"}
          </p>
          <p>
            Fail2ban:{" "}
            {securityPosture?.security?.anti_abuse?.fail2ban_enabled
              ? "enabled"
              : "disabled"}
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
        <h2 className="mb-2 text-sm font-semibold text-[#E4E4E7]">
          Délivrabilité & réputation
        </h2>
        <p className="text-xs text-[#71717A]">
          SPF/DKIM/DMARC/PTR + diagnostics spam.
        </p>
        <div className="mt-3 space-y-2 text-xs text-[#D4D4D8]">
          <p>Events analysés: {asInt(deliverability?.total_events ?? 0)}</p>
          <p>Bounces: {asInt(deliverability?.bounces_total ?? 0)}</p>
          <p>
            SPF fail: {percent(deliverability?.spf?.failure_rate ?? 0)} ·
            DKIM fail: {percent(deliverability?.dkim?.failure_rate ?? 0)} ·
            DMARC fail: {percent(deliverability?.dmarc?.failure_rate ?? 0)}
          </p>
          <p>
            Réputation: score{" "}
            {deliverability?.reputation?.avg_risk_score ?? 0}
            /100 · high-risk{" "}
            {asInt(deliverability?.reputation?.high_risk_events ?? 0)}
          </p>
          <p>
            Top bounce:{" "}
            {deliverability?.top_bounce_reasons?.[0]?.reason ?? "—"}
          </p>
          <p>
            RBL status: {deliverability?.rbl?.status ?? "—"} (
            {(deliverability?.rbl?.listed_by ?? []).join(", ") || "clean"})
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
        <h2 className="mb-2 text-sm font-semibold text-[#E4E4E7]">
          Supervision centralisée
        </h2>
        <p className="text-xs text-[#71717A]">
          Queues, latence, alertes temps réel, exports observabilité.
        </p>
        <div className="mt-3 space-y-2 text-xs text-[#D4D4D8]">
          <p>
            Queue SMTP:{" "}
            {asInt(observability?.health_realtime?.queue?.depth ?? 0)}
            {" · "}âge max{" "}
            {asInt(
              observability?.health_realtime?.queue?.oldest_age_seconds ?? 0
            )}
            s
          </p>
          <p>
            Débit in/out:{" "}
            {observability?.health_realtime?.throughput?.incoming_per_min?.toFixed(
              2
            ) ?? "0.00"}
            /min ·{" "}
            {observability?.health_realtime?.throughput?.outgoing_per_min?.toFixed(
              2
            ) ?? "0.00"}
            /min
          </p>
          <p>
            Succès:{" "}
            {percent(
              observability?.health_realtime?.delivery?.success_rate ?? 0
            )}{" "}
            · 4xx{" "}
            {percent(
              observability?.health_realtime?.delivery?.smtp_4xx_rate ?? 0
            )}{" "}
            · 5xx{" "}
            {percent(
              observability?.health_realtime?.delivery?.smtp_5xx_rate ?? 0
            )}
          </p>
          <p>
            P95 delivery:{" "}
            {asInt(
              observability?.health_realtime?.delivery?.p95_total_ms ?? 0
            )}{" "}
            ms
          </p>
          <p>
            Alertes seuils: queue{" "}
            {asInt(
              observability?.proactive_alerting?.threshold_alerts
                ?.queue_growth ?? 0
            )}{" "}
            · auth{" "}
            {asInt(
              observability?.proactive_alerting?.threshold_alerts
                ?.auth_failures ?? 0
            )}{" "}
            · IMAP{" "}
            {observability?.proactive_alerting?.threshold_alerts
              ?.imap_latency_alert
              ? "high"
              : "ok"}
          </p>
          <p>
            Corrélation: DNS issues{" "}
            {asInt(
              observability?.proactive_alerting?.correlation?.dns
                ?.lookup_issue_events ?? 0
            )}{" "}
            · RBL{" "}
            {(
              observability?.proactive_alerting?.correlation?.blacklist
                ?.listed_by ?? []
            ).join(",") || "clean"}
          </p>
          <p>
            Login suspects:{" "}
            {(
              observability?.security_deliverability
                ?.suspicious_logins_top ?? []
            )
              .slice(0, 2)
              .map((x) => `${x.ip ?? "?"}(${x.attempts ?? 0})`)
              .join(" · ") || "none"}
          </p>
          <p>
            Exports: Prometheus{" "}
            {observability?.exports?.prometheus_enabled ? "on" : "off"} ·
            SIEM{" "}
            {observability?.exports?.siem_webhook_configured
              ? "configured"
              : "not configured"}
          </p>
        </div>
      </article>
    </section>
  )}

  {adminDataLoading && (
    <p className="text-xs text-[#A1A1AA]">
      Chargement des données admin backend…
    </p>
  )}
  {adminDataError && (
    <p className="text-xs text-[#FCA5A5]">
      Erreur backend admin: {adminDataError}
    </p>
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

    </>
  );
}
