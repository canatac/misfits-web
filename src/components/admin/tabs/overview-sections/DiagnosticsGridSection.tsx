"use client";
import React from "react";
import { asInt, percent } from "../../shared";
import type { ActiveTabScope, LocalDeliverabilityDiag, LocalObservabilityOverview, LocalSecurityPosture } from "./types";

interface DiagnosticsGridSectionProps {
  activeTab: ActiveTabScope;
  securityPosture: LocalSecurityPosture | null;
  deliverability: LocalDeliverabilityDiag | null;
  observability: LocalObservabilityOverview | null;
}

export function DiagnosticsGridSection({
  activeTab,
  securityPosture,
  deliverability,
  observability,
}: DiagnosticsGridSectionProps) {
  return (
    <>
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
            .map((x: { ip?: string; attempts?: number }) => `${x.ip ?? "?"}(${x.attempts ?? 0})`)
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
    </>
  );
}
