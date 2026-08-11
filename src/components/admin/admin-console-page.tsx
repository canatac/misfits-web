"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import {
  useAdminChangelog,
  useAdminUsers,
  useChangeRequests,
  useCreateChangeRequest,
  useTransitionChangeRequest,
  useUpdateAdminUserRole,
} from "@/hooks/use-admin-ops";
import type {
  ChangeRequestItem,
  CreateChangeRequestInput,
  WorkflowStatus,
  AdminUserRecord,
} from "@/types/admin-ops";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import { cn } from "@/lib/utils";

type AdminTab =
  | "overview"
  | "monitoring"
  | "security"
  | "changelog"
  | "change-requests"
  | "users";

const WINDOW_OPTIONS: MonitoringWindow[] = ["15m", "1h", "6h", "24h", "7d"];
const SEVERITY_OPTIONS: Array<SecuritySeverity | "all"> = [
  "all",
  "info",
  "low",
  "medium",
  "high",
  "critical",
];
const WORKFLOW_STATUS_COLUMNS: WorkflowStatus[] = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
  "rejected",
];

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  submitted: "Soumise",
  triaged: "Triage",
  planned: "Planifiée",
  in_progress: "En cours",
  qa: "QA",
  released: "Released",
  rejected: "Rejetée",
};

type AdminSecurityPostureResponse = {
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
      domain?: string;
      spf_expected?: string;
      dkim_selector?: string;
      dmarc_expected?: string;
      ptr_rdns_note?: string;
    };
  };
};

type AdminDeliverabilityDiagnosticsResponse = {
  total_events?: number;
  bounces_total?: number;
  auth_policy_alerts?: number;
  spf?: { failures?: number; failure_rate?: number };
  dkim?: { failures?: number; failure_rate?: number };
  dmarc?: { failures?: number; failure_rate?: number };
  reputation?: {
    avg_risk_score?: number;
    high_risk_events?: number;
    ip_domain_status?: string;
  };
  top_bounce_reasons?: Array<{ reason: string; count: number }>;
  rbl?: {
    sources?: string[];
    listed_by?: string[];
    status?: string;
  };
};

type AdminObservabilityOverviewResponse = {
  smtp?: {
    total_events?: number;
    failure_events?: number;
    p95_total_ms?: number;
  };
  health_realtime?: {
    queue?: {
      depth?: number;
      oldest_age_seconds?: number | null;
    };
    throughput?: {
      incoming_per_min?: number;
      outgoing_per_min?: number;
    };
    delivery?: {
      success_rate?: number;
      smtp_4xx_rate?: number;
      smtp_5xx_rate?: number;
      p95_total_ms?: number;
    };
  };
  proactive_alerting?: {
    threshold_alerts?: {
      queue_growth?: number;
      auth_failures?: number;
      imap_latency_alert?: boolean;
    };
    anomaly_detection?: {
      anomaly_alerts?: number;
      spam_or_volume_spike?: boolean;
      sudden_bounce_signal?: boolean;
    };
    correlation?: {
      smtp?: { events?: number; smtp_4xx?: number; smtp_5xx?: number };
      imap?: { active_connections?: number | null; p95_ms?: number | null };
      dns?: { lookup_issue_events?: number };
      blacklist?: {
        sources?: string[];
        listed_by?: string[];
        listed?: boolean;
      };
    };
  };
  security_deliverability?: {
    suspicious_logins_top?: Array<{ ip?: string; attempts?: number }>;
    active_security_alerts?: number;
    active_monitoring_alerts?: number;
  };
  imap?: {
    active_connections?: number | null;
  };
  realtime_alerts?: {
    monitoring_active?: number;
    security_active?: number;
  };
  exports?: {
    prometheus_enabled?: boolean;
    siem_webhook_configured?: boolean;
  };
  per_domain?: Array<{
    domain: string;
    count: number;
    delivered: number;
    bounced: number;
  }>;
};

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

function priorityTone(
  priority: ChangeRequestItem["priority"]
): "danger" | "warn" | "ok" {
  if (priority === "P0") return "danger";
  if (priority === "P1") return "warn";
  return "ok";
}

function statusTone(
  status: WorkflowStatus
): "danger" | "warn" | "ok" | "neutral" {
  if (status === "rejected") return "danger";
  if (status === "released") return "ok";
  if (status === "submitted" || status === "triaged") return "warn";
  return "neutral";
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

  const adminChangelog = useAdminChangelog();
  const changeRequests = useChangeRequests();
  const adminUsers = useAdminUsers();
  const createChangeRequest = useCreateChangeRequest();
  const transitionChangeRequest = useTransitionChangeRequest();
  const updateAdminUserRole = useUpdateAdminUserRole();

  const [newRequest, setNewRequest] = useState<CreateChangeRequestInput>({
    title: "",
    problem: "",
    desiredOutcome: "",
    scope: "fullstack",
    urgency: "medium",
    impact: "medium",
    requestedBy: "admin",
    linkedRepo: "cross-repo",
  });

  const [transitionNote, setTransitionNote] = useState("");
  const [harnessProblem, setHarnessProblem] = useState("");
  const [harnessImpact, setHarnessImpact] = useState("");
  const [harnessQuality, setHarnessQuality] = useState("");
  const [harnessRollback, setHarnessRollback] = useState("");

  const [securityPosture, setSecurityPosture] =
    useState<AdminSecurityPostureResponse | null>(null);
  const [deliverability, setDeliverability] =
    useState<AdminDeliverabilityDiagnosticsResponse | null>(null);
  const [observability, setObservability] =
    useState<AdminObservabilityOverviewResponse | null>(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);

  const [assistantPrompt, setAssistantPrompt] = useState(
    "Fais-moi un résumé de la situation actuelle et les actions prioritaires à lancer dans les 2 prochaines heures."
  );
  const [assistantAnswer, setAssistantAnswer] = useState<string>("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setAdminDataLoading(true);
      setAdminDataError(null);
      try {
        const [securityRes, deliverabilityRes, observabilityRes] =
          await Promise.all([
            fetch(`/api/admin/security/posture?window=${windowRange}`, {
              cache: "no-store",
            }),
            fetch(
              `/api/admin/deliverability/diagnostics?window=${windowRange}`,
              {
                cache: "no-store",
              }
            ),
            fetch(`/api/admin/observability/overview?window=${windowRange}`, {
              cache: "no-store",
            }),
          ]);

        if (!securityRes.ok || !deliverabilityRes.ok || !observabilityRes.ok) {
          throw new Error(
            `admin_api_status=${securityRes.status}/${deliverabilityRes.status}/${observabilityRes.status}`
          );
        }

        const [securityData, deliverabilityData, observabilityData] =
          await Promise.all([
            securityRes.json(),
            deliverabilityRes.json(),
            observabilityRes.json(),
          ]);

        if (cancelled) return;

        setSecurityPosture(securityData);
        setDeliverability(deliverabilityData);
        setObservability(observabilityData);
      } catch (error) {
        if (cancelled) return;
        setAdminDataError(
          error instanceof Error ? error.message : "admin_data_load_failed"
        );
      } finally {
        if (!cancelled) {
          setAdminDataLoading(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [windowRange]);

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

  const adminAssistantSnapshot = useMemo(
    () => ({
      window: windowRange,
      severity,
      summary: monitoringSummary.data ?? null,
      monitoring_alerts: monitoringAlerts.data?.alerts?.slice(0, 15) ?? [],
      security_alerts: securityActive.data?.alerts?.slice(0, 15) ?? [],
      providers: monitoringProviders.data?.providers?.slice(0, 10) ?? [],
      bounces: monitoringBounces.data?.bounces?.slice(0, 10) ?? [],
      monitoring_live: monitoringLive.events.slice(0, 12),
      security_live: securityLive.alerts.slice(0, 12),
      observability,
      deliverability,
      security_posture: securityPosture,
      admin_data_loading: adminDataLoading,
      admin_data_error: adminDataError,
    }),
    [
      windowRange,
      severity,
      monitoringSummary.data,
      monitoringAlerts.data,
      securityActive.data,
      monitoringProviders.data,
      monitoringBounces.data,
      monitoringLive.events,
      securityLive.alerts,
      observability,
      deliverability,
      securityPosture,
      adminDataLoading,
      adminDataError,
    ]
  );

  async function askHermesForAdminPlan() {
    const prompt = assistantPrompt.trim();
    if (!prompt) {
      setAssistantError("Merci de saisir une demande.");
      return;
    }

    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Tu es Hermes, copilote SRE/DevOps de la console admin misfits.ai Mail. Réponds en français, de façon actionnable et concise. Donne exactement deux sections: 1) Résumé opérationnel (4-6 puces), 2) Actions à réaliser (checklist priorisée P0/P1/P2 avec commandes/étapes de vérification). Si des données sont absentes ou incohérentes, indique clairement les vérifications à lancer.",
            },
            {
              role: "user",
              content: `Contexte observabilité/sécurité (JSON):\n${JSON.stringify(
                adminAssistantSnapshot
              )}\n\nDemande opérateur:\n${prompt}`,
            },
          ],
          sessionId: "admin-console-operations",
          sessionKey: "misfits-admin-console",
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `hermes_request_failed_${response.status}`
        );
      }

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.content ??
        "Aucune réponse Hermes reçue.";

      setAssistantAnswer(
        typeof content === "string" ? content : JSON.stringify(content)
      );
    } catch (error) {
      setAssistantError(
        error instanceof Error
          ? error.message
          : "Erreur lors de l’appel Hermes."
      );
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleCreateChangeRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (qualityChecks.score < 4) {
      return;
    }

    await createChangeRequest.mutateAsync(newRequest);
    setNewRequest((prev) => ({
      ...prev,
      title: "",
      problem: "",
      desiredOutcome: "",
    }));
  }

  async function handleTransition(id: string, action: "advance" | "reject") {
    await transitionChangeRequest.mutateAsync({
      id,
      action,
      note: transitionNote.trim() || undefined,
    });
  }

  function applyHarnessToForm() {
    const fusedProblem = [harnessProblem.trim(), harnessImpact.trim()]
      .filter(Boolean)
      .join("\n\nImpact: ");

    const fusedOutcome = [harnessQuality.trim(), harnessRollback.trim()]
      .filter(Boolean)
      .join("\n\nRollback/mitigation: ");

    setNewRequest((prev) => ({
      ...prev,
      problem: fusedProblem || prev.problem,
      desiredOutcome: fusedOutcome || prev.desiredOutcome,
    }));
  }

  async function handleUserRoleChange(
    id: string,
    role: AdminUserRecord["role"]
  ) {
    await updateAdminUserRole.mutateAsync({ id, role });
  }

  const qualityChecks = useMemo(() => {
    const checks = [
      {
        label: "Problème explicite (cause + symptôme)",
        ok: newRequest.problem.trim().length >= 40,
      },
      {
        label: "Impact utilisateur/business explicite",
        ok: /impact|client|utilisateur|business|latence|erreur/i.test(
          `${newRequest.problem} ${harnessImpact}`
        ),
      },
      {
        label: "Critères de succès mesurables",
        ok: /%|ms|slo|sla|kpi|p95|objectif|mesurable|test/i.test(
          `${newRequest.desiredOutcome} ${harnessQuality}`
        ),
      },
      {
        label: "Plan de rollback / mitigation",
        ok: /rollback|revert|fallback|mitigation/i.test(
          `${newRequest.desiredOutcome} ${harnessRollback}`
        ),
      },
      {
        label: "Portée repo + priorité cohérentes",
        ok:
          (newRequest.linkedRepo === "cross-repo" &&
            newRequest.scope === "fullstack") ||
          newRequest.linkedRepo !== "cross-repo",
      },
    ];

    return {
      checks,
      score: checks.filter((c) => c.ok).length,
    };
  }, [
    newRequest.problem,
    newRequest.desiredOutcome,
    newRequest.linkedRepo,
    newRequest.scope,
    harnessImpact,
    harnessQuality,
    harnessRollback,
  ]);

  const requestsByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      WORKFLOW_STATUS_COLUMNS.map((status) => [
        status,
        [] as ChangeRequestItem[],
      ])
    ) as Record<WorkflowStatus, ChangeRequestItem[]>;

    for (const item of changeRequests.data?.items ?? []) {
      grouped[item.status].push(item);
    }

    return grouped;
  }, [changeRequests.data?.items]);

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
              ["users", "Utilisateurs"],
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

      {activeTab === "changelog" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#E4E4E7]">
                Changelog Admin
              </h2>
              <p className="mt-1 text-xs text-[#71717A]">
                Flux consolidé GitHub + releases issues du workflow Change
                Request.
              </p>
            </div>
            <Badge tone={adminChangelog.isFetching ? "warn" : "ok"}>
              {adminChangelog.isFetching ? "refreshing" : "live"}
            </Badge>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-1">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Releases issues du workflow
              </h3>
              <div className="mt-3 space-y-2">
                {(adminChangelog.data?.workflowReleases ?? []).map(
                  (release) => (
                    <div
                      key={release.id}
                      className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#E4E4E7]">
                          {release.title}
                        </p>
                        <Badge tone={priorityTone(release.priority)}>
                          {release.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#A1A1AA]">
                        {release.summary}
                      </p>
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        {asDate(release.releasedAt)} · {release.scope} ·{" "}
                        {release.sourceChangeRequestId}
                      </p>
                    </div>
                  )
                )}
                {!adminChangelog.data?.workflowReleases?.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucune release issue d&apos;une change request pour le
                    moment.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Commits récents
              </h3>
              <div className="mt-3 space-y-3">
                {(adminChangelog.data?.repositories ?? []).map((repo) => (
                  <div
                    key={repo.key}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm text-[#E4E4E7]">
                        {repo.owner}/{repo.repo}
                      </p>
                      <Badge>{repo.latestShortSha}</Badge>
                    </div>
                    <div className="space-y-2">
                      {repo.commits.slice(0, 6).map((commit) => (
                        <div
                          key={commit.sha}
                          className="rounded-md border border-[#242429] bg-[#141419] p-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={commit.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-xs font-medium text-[#F2D5A7] hover:underline"
                            >
                              {commit.shortSha} · {commit.message}
                            </a>
                            {commit.workflowUrl ? (
                              <a
                                href={commit.workflowUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#86EFAC] hover:underline"
                              >
                                {commit.workflowName || "workflow"}
                              </a>
                            ) : (
                              <span className="text-[11px] text-[#71717A]">
                                no run
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-[#71717A]">
                            {commit.author} · {asDate(commit.committedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {adminChangelog.isError && (
                  <p className="text-sm text-[#FCA5A5]">
                    Erreur changelog: {adminChangelog.error.message}
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "change-requests" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#E4E4E7]">
                Change Requests
              </h2>
              <p className="mt-1 text-xs text-[#71717A]">
                Point d&apos;entrée unique des évolutions produit. Soumission →
                triage → plan → build → QA → release.
              </p>
            </div>
            <Badge tone={changeRequests.isFetching ? "warn" : "ok"}>
              {changeRequests.isFetching ? "syncing" : "workflow live"}
            </Badge>
          </div>

          <div className="grid gap-3 xl:grid-cols-5">
            <form
              onSubmit={handleCreateChangeRequest}
              className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-3"
            >
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Nouvelle demande
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={newRequest.title}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                  placeholder="Titre (ex: Flux changelog + CR admin)"
                  required
                  minLength={8}
                />
                <input
                  value={newRequest.requestedBy}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      requestedBy: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                  placeholder="Requested by"
                  required
                />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <select
                  value={newRequest.scope}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      scope: e.target
                        .value as CreateChangeRequestInput["scope"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="ux">Scope UX</option>
                  <option value="backend">Scope Backend</option>
                  <option value="fullstack">Scope Fullstack</option>
                  <option value="security">Scope Security</option>
                </select>
                <select
                  value={newRequest.urgency}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      urgency: e.target
                        .value as CreateChangeRequestInput["urgency"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="low">Urgence low</option>
                  <option value="medium">Urgence medium</option>
                  <option value="high">Urgence high</option>
                </select>
                <select
                  value={newRequest.impact}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      impact: e.target
                        .value as CreateChangeRequestInput["impact"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="small">Impact small</option>
                  <option value="medium">Impact medium</option>
                  <option value="high">Impact high</option>
                </select>
              </div>
              <div className="mt-2">
                <select
                  value={newRequest.linkedRepo}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      linkedRepo: e.target
                        .value as CreateChangeRequestInput["linkedRepo"],
                    }))
                  }
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="misfits-web">Repo: misfits-web</option>
                  <option value="reimagined-guide">
                    Repo: reimagined-guide
                  </option>
                  <option value="cross-repo">Repo: cross-repo</option>
                </select>
              </div>
              <textarea
                value={newRequest.problem}
                onChange={(e) =>
                  setNewRequest((prev) => ({
                    ...prev,
                    problem: e.target.value,
                  }))
                }
                className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                placeholder="Problème à résoudre"
                minLength={16}
                required
              />
              <textarea
                value={newRequest.desiredOutcome}
                onChange={(e) =>
                  setNewRequest((prev) => ({
                    ...prev,
                    desiredOutcome: e.target.value,
                  }))
                }
                className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                placeholder="Résultat attendu + critères de succès"
                minLength={16}
                required
              />
              <button
                type="submit"
                className="mt-2 rounded-lg border border-[#C49B66] bg-[#2A2218] px-3 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
                disabled={createChangeRequest.isPending || qualityChecks.score < 4}
              >
                {createChangeRequest.isPending
                  ? "Création..."
                  : "Créer et lancer le workflow"}
              </button>
              {qualityChecks.score < 4 && (
                <p className="mt-2 text-xs text-[#FCD34D]">
                  Complète au moins 4/5 critères qualité via le harnais avant
                  soumission.
                </p>
              )}
            </form>

            <aside className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Harnais de formulation
                </h3>
                <Badge tone={qualityChecks.score >= 4 ? "ok" : "warn"}>
                  qualité {qualityChecks.score}/5
                </Badge>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Dialogue guidé pour cadrer la demande selon les standards de dev
                et de qualité: problème, impact, critères mesurables et
                rollback.
              </p>

              <div className="mt-3 space-y-2">
                <textarea
                  value={harnessProblem}
                  onChange={(e) => setHarnessProblem(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="1) Quel est le problème racine observé ?"
                />
                <textarea
                  value={harnessImpact}
                  onChange={(e) => setHarnessImpact(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="2) Quel impact utilisateur/business/opérations ?"
                />
                <textarea
                  value={harnessQuality}
                  onChange={(e) => setHarnessQuality(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="3) Quels critères de succès mesurables (SLO/KPI/tests) ?"
                />
                <textarea
                  value={harnessRollback}
                  onChange={(e) => setHarnessRollback(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="4) Quel plan de rollback/fallback si régression ?"
                />

                <button
                  type="button"
                  onClick={applyHarnessToForm}
                  className="rounded-lg border border-[#3A3A42] px-2.5 py-1.5 text-xs text-[#D4D4D8]"
                >
                  Injecter dans le formulaire
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
                <p className="mb-1 text-[11px] text-[#A1A1AA]">
                  Checklist qualité
                </p>
                <div className="space-y-1">
                  {qualityChecks.checks.map((check) => (
                    <p
                      key={check.label}
                      className={cn(
                        "text-xs",
                        check.ok ? "text-[#86EFAC]" : "text-[#FCD34D]"
                      )}
                    >
                      {check.ok ? "✓" : "•"} {check.label}
                    </p>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-3 rounded-xl border border-[#232327] bg-[#151518] p-3">
            <label className="text-xs text-[#A1A1AA]">
              Note de transition (optionnelle)
            </label>
            <input
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
              placeholder="Ex: spec validée, passage en build"
            />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {WORKFLOW_STATUS_COLUMNS.map((status) => (
              <article
                key={status}
                className="rounded-xl border border-[#232327] bg-[#151518] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                    {STATUS_LABEL[status]}
                  </h3>
                  <Badge tone={statusTone(status)}>
                    {requestsByStatus[status].length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {requestsByStatus[status].map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-[#E4E4E7]">{item.title}</p>
                        <Badge tone={priorityTone(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#A1A1AA]">
                        {item.desiredOutcome}
                      </p>
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        {item.linkedRepo} · {item.targetReleaseWindow} ·{" "}
                        {item.id}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-[#3A3A42] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                          disabled={
                            item.status === "released" ||
                            item.status === "rejected" ||
                            transitionChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(item.id, "advance")
                          }
                        >
                          Advance
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                          disabled={
                            item.status === "released" ||
                            item.status === "rejected" ||
                            transitionChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(item.id, "reject")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {!requestsByStatus[status].length && (
                    <p className="text-xs text-[#71717A]">Aucune demande.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#E4E4E7]">
                Gestion des utilisateurs
              </h2>
              <p className="mt-1 text-xs text-[#71717A]">
                Pilotage des rôles et activité opérationnelle récente.
              </p>
            </div>
            <Badge tone={adminUsers.isFetching ? "warn" : "ok"}>
              {adminUsers.isFetching ? "syncing" : "live"}
            </Badge>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">Utilisateurs</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(adminUsers.data?.users.length ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">Admins</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(
                  (adminUsers.data?.users ?? []).filter(
                    (u) => u.role === "admin"
                  ).length
                )}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">Support</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(
                  (adminUsers.data?.users ?? []).filter(
                    (u) => u.role === "support"
                  ).length
                )}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">2FA activée</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(
                  (adminUsers.data?.users ?? []).filter(
                    (u) => u.twoFactorEnabled
                  ).length
                )}
              </p>
            </article>
          </div>

          <div className="space-y-3">
            {(adminUsers.data?.users ?? []).map((user) => (
              <article
                key={user.id}
                className="rounded-xl border border-[#232327] bg-[#151518] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#E4E4E7]">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-[#71717A]">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={user.status === "active" ? "ok" : "warn"}>
                      {user.status}
                    </Badge>
                    <Badge tone={user.twoFactorEnabled ? "ok" : "warn"}>
                      2FA {user.twoFactorEnabled ? "on" : "off"}
                    </Badge>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        void handleUserRoleChange(
                          user.id,
                          e.target.value as AdminUserRecord["role"]
                        )
                      }
                      disabled={updateAdminUserRole.isPending}
                      className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
                    >
                      <option value="user">user</option>
                      <option value="support">support</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 text-xs text-[#A1A1AA] md:grid-cols-4">
                  <p>Dernier login: {asDate(user.lastLoginAt || "")}</p>
                  <p>Dernière activité: {asDate(user.lastActivityAt || "")}</p>
                  <p>Sessions 24h: {asInt(user.sessions24h)}</p>
                  <p>Actions 7j: {asInt(user.actions7d)}</p>
                </div>

                <div className="mt-2">
                  <p className="text-xs text-[#A1A1AA]">Activité récente</p>
                  <div className="mt-1 space-y-1">
                    {user.recentActivity.slice(0, 3).map((evt, index) => (
                      <p
                        key={`${user.id}_${index}`}
                        className="text-xs text-[#D4D4D8]"
                      >
                        {asDate(evt.at)} · {evt.kind} · {evt.label}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {adminUsers.isError && (
              <p className="text-sm text-[#FCA5A5]">
                Erreur users: {adminUsers.error.message}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
