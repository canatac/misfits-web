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
  useAdminAiActivity,
  useAdminAuditLog,
  useAdminChangelog,
  useAdminUsers,
  useAdminWhoami,
  useChangeRequests,
  useCreateAdminUser,
  useCreateChangeRequest,
  useDeleteChangeRequest,
  useDeleteAdminUser,
  useInviteAdminUser,
  useResetAdminPassword,
  useStartImplementationChangeRequest,
  useTransitionChangeRequest,
  useUpdateAdminUser,
} from "@/hooks/use-admin-ops";
import type {
  ChangeRequestItem,
  CreateAdminUserInput,
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
  | "deliverability-ops"
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

type DeliverabilityProcedureItem = {
  id: string;
  title: string;
  status: "done" | "done_manual" | "in_progress" | "todo" | "blocked";
  evidence?: string;
  operator_note?: string;
  cta?: { label?: string; kind?: string; details?: string };
};

type DeliverabilityProcedureResponse = {
  overall_status?: string;
  domain?: string;
  window?: string;
  progress?: { done?: number; total?: number };
  reminder?: { enabled?: boolean; cadence_hours?: number; next_due_at?: string };
  checklist?: DeliverabilityProcedureItem[];
  cta_details?: Array<{ id: string; label: string; description: string }>;
  automation?: {
    auto_checks?: string[];
    last_computed_at?: string;
  };
};

type ChangeRequestChatField =
  | "problemRoot" | "impact" | "successCriteria" | "rollbackPlan" | "none";

type ChangeRequestChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ChangeRequestGuideDraft = {
  problemRoot: string;
  impact: string;
  successCriteria: string;
  rollbackPlan: string;
};

const CHANGE_REQUEST_GUIDE_ORDER: Array<
  Exclude<ChangeRequestChatField, "none">
> = ["problemRoot", "impact", "successCriteria", "rollbackPlan"];

const CHANGE_REQUEST_GUIDE_LABEL: Record<
  Exclude<ChangeRequestChatField, "none">,
  string
> = {
  problemRoot: "problème racine",
  impact: "impact utilisateur/business",
  successCriteria: "critères de succès mesurables",
  rollbackPlan: "plan de rollback/mitigation",
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

function minutesBetween(fromIso?: string, toIso?: string): number | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return Math.round((to - from) / 60000);
}

function formatDurationMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}h ${m.toString().padStart(2, "0")}`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return `${d}j ${remH}h`;
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

function runStateFromStatus(
  status: WorkflowStatus
): "running" | "queued" | "completed" | "failed" {
  if (status === "released") return "completed";
  if (status === "rejected") return "failed";
  if (status === "in_progress" || status === "qa") return "running";
  return "queued";
}

function runStateTone(
  state: ReturnType<typeof runStateFromStatus>
): "danger" | "warn" | "ok" | "neutral" {
  if (state === "failed") return "danger";
  if (state === "completed") return "ok";
  if (state === "queued") return "warn";
  return "neutral";
}

function runStateLabel(state: ReturnType<typeof runStateFromStatus>): string {
  if (state === "running") return "running";
  if (state === "queued") return "queued";
  if (state === "completed") return "completed";
  return "failed";
}

function executionStateTone(
  state: ChangeRequestItem["executionState"]
): "danger" | "warn" | "ok" | "neutral" {
  if (state === "failed") return "danger";
  if (state === "success") return "ok";
  if (state === "queued" || state === "running") return "warn";
  return "neutral";
}

function executionStateLabel(
  state: ChangeRequestItem["executionState"]
): string {
  if (state === "running") return "running";
  if (state === "queued") return "queued";
  if (state === "success") return "success";
  if (state === "failed") return "failed";
  return "idle";
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
  const whoami = useAdminWhoami();
  // Effective role gate: when RBAC is enforced on the backend, hide CRUD
  // affordances for anything other than an admin. When RBAC is OFF, the
  // backend answers { role: "admin", enforced: false } so canWriteUsers
  // stays true and the current behaviour is preserved.
  const canWriteUsers = (whoami.data?.role ?? "admin") === "admin";
  const rbacEnforced = whoami.data?.enforced === true;
  const inviteAdminUser = useInviteAdminUser();
  const resetAdminPassword = useResetAdminPassword();
  const adminAuditLog = useAdminAuditLog(100);
  const adminAiActivity = useAdminAiActivity(50);
  const createChangeRequest = useCreateChangeRequest();
  const transitionChangeRequest = useTransitionChangeRequest();
  const deleteChangeRequest = useDeleteChangeRequest();
  const startImplementationChangeRequest =
    useStartImplementationChangeRequest();
  const updateAdminUser = useUpdateAdminUser();
  const createAdminUser = useCreateAdminUser();
  const deleteAdminUser = useDeleteAdminUser();

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
  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    displayName: "",
    role: "user",
    status: "active",
    twoFactorEnabled: false,
  });

  const [transitionNote, setTransitionNote] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [crGuideDraft, setCrGuideDraft] = useState<ChangeRequestGuideDraft>({
    problemRoot: "",
    impact: "",
    successCriteria: "",
    rollbackPlan: "",
  });
  const [crGuideStepIndex, setCrGuideStepIndex] = useState(0);
  const [crGuideMessages, setCrGuideMessages] = useState<
    ChangeRequestChatMessage[]
  >([
    {
      role: "assistant",
      content:
        "Je t’aide à remplir la change request. Commence par décrire le problème racine (symptôme + cause probable).",
    },
  ]);
  const [crGuideInput, setCrGuideInput] = useState("");
  const [crGuideLoading, setCrGuideLoading] = useState(false);
  const [crGuideError, setCrGuideError] = useState<string | null>(null);

  const [securityPosture, setSecurityPosture] =
    useState<AdminSecurityPostureResponse | null>(null);
  const [deliverability, setDeliverability] =
    useState<AdminDeliverabilityDiagnosticsResponse | null>(null);
  const [deliverabilityProcedure, setDeliverabilityProcedure] =
    useState<DeliverabilityProcedureResponse | null>(null);
  const [observability, setObservability] =
    useState<AdminObservabilityOverviewResponse | null>(null);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);
  const [procedureSaving, setProcedureSaving] = useState(false);

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
        const [securityRes, deliverabilityRes, observabilityRes, procedureRes] =
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
            fetch(`/api/admin/deliverability/procedure?window=${windowRange}`, {
              cache: "no-store",
            }),
          ]);

        if (
          !securityRes.ok ||
          !deliverabilityRes.ok ||
          !observabilityRes.ok ||
          !procedureRes.ok
        ) {
          throw new Error(
            `admin_api_status=${securityRes.status}/${deliverabilityRes.status}/${observabilityRes.status}/${procedureRes.status}`
          );
        }

        const [securityData, deliverabilityData, observabilityData, procedureData] =
          await Promise.all([
            securityRes.json(),
            deliverabilityRes.json(),
            observabilityRes.json(),
            procedureRes.json(),
          ]);

        if (cancelled) return;

        setSecurityPosture(securityData);
        setDeliverability(deliverabilityData);
        setObservability(observabilityData);
        setDeliverabilityProcedure(procedureData);
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

  async function saveProcedureUpdate(payload: {
    checklist?: Array<{ id: string; checked: boolean; note?: string }>;
    reminder?: { enabled: boolean; cadence_hours: number };
  }) {
    setProcedureSaving(true);
    try {
      const res = await fetch(`/api/admin/deliverability/procedure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `procedure_update_failed_${res.status}`);
      }

      const fresh = await fetch(
        `/api/admin/deliverability/procedure?window=${windowRange}`,
        {
          cache: "no-store",
        }
      );
      if (fresh.ok) {
        setDeliverabilityProcedure(await fresh.json());
      }
    } catch (error) {
      setAdminDataError(
        error instanceof Error ? error.message : "deliverability_procedure_save_failed"
      );
    } finally {
      setProcedureSaving(false);
    }
  }

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
      deliverability_procedure: deliverabilityProcedure,
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
      deliverabilityProcedure,
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

  async function handleTransition(
    id: string,
    action:
      | "advance"
      | "reject"
      | "stop"
      | "cancel"
      | "execution_queue"
      | "execution_start"
      | "execution_heartbeat"
      | "execution_fail"
      | "execution_success"
      | "execution_reset",
    currentStatus: WorkflowStatus
  ) {
    await transitionChangeRequest.mutateAsync({
      id,
      action,
      currentStatus,
      note: transitionNote.trim() || undefined,
      actor: "hermes",
    });
  }

  async function handleDeleteChangeRequest(id: string) {
    if (!window.confirm("Supprimer définitivement cette change request ?")) {
      return;
    }
    await deleteChangeRequest.mutateAsync(id);
  }

  async function handleStartImplementation(
    id: string,
    currentStatus: WorkflowStatus
  ) {
    await startImplementationChangeRequest.mutateAsync({
      id,
      currentStatus,
      note: transitionNote.trim() || undefined,
      actor: "hermes",
    });
  }

  function applyGuideToForm(nextDraft?: ChangeRequestGuideDraft) {
    const draft = nextDraft ?? crGuideDraft;
    const fusedProblem = [
      draft.problemRoot.trim(),
      draft.impact.trim() && `Impact: ${draft.impact.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const fusedOutcome = [
      draft.successCriteria.trim(),
      draft.rollbackPlan.trim() &&
        `Rollback/mitigation: ${draft.rollbackPlan.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    setNewRequest((prev) => ({
      ...prev,
      problem: fusedProblem || prev.problem,
      desiredOutcome: fusedOutcome || prev.desiredOutcome,
    }));
  }

  function parseGuideResponse(raw: string): {
    assistantReply?: string;
    field?: ChangeRequestChatField;
    fieldValue?: string;
    nextQuestion?: string;
  } {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "");
    try {
      return JSON.parse(cleaned) as {
        assistantReply?: string;
        field?: ChangeRequestChatField;
        fieldValue?: string;
        nextQuestion?: string;
      };
    } catch {
      return { assistantReply: raw };
    }
  }

  async function handleGuideChatSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const prompt = crGuideInput.trim();
    if (!prompt || crGuideLoading) return;

    const field =
      CHANGE_REQUEST_GUIDE_ORDER[
        Math.min(crGuideStepIndex, CHANGE_REQUEST_GUIDE_ORDER.length - 1)
      ];

    setCrGuideError(null);
    setCrGuideInput("");
    setCrGuideMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setCrGuideLoading(true);

    try {
      const response = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'Tu es assistant de formulation de change request. Réponds strictement en JSON sans markdown: {"assistantReply":string,"field":"problemRoot"|"impact"|"successCriteria"|"rollbackPlan"|"none","fieldValue":string,"nextQuestion":string}. fieldValue doit reformuler la réponse utilisateur en version exploitable et concise. nextQuestion doit poser la prochaine question utile pour compléter le formulaire.',
            },
            {
              role: "user",
              content: JSON.stringify({
                currentField: field,
                userMessage: prompt,
                draft: crGuideDraft,
                form: newRequest,
                remainingFields: CHANGE_REQUEST_GUIDE_ORDER.slice(
                  Math.min(
                    crGuideStepIndex + 1,
                    CHANGE_REQUEST_GUIDE_ORDER.length
                  )
                ).map((k) => CHANGE_REQUEST_GUIDE_LABEL[k]),
              }),
            },
          ],
          sessionId: "admin-change-request-guide",
          sessionKey: "misfits-admin-change-request-guide",
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`guide_chat_failed_${response.status}`);
      }

      const data = await response.json();
      const raw =
        data?.choices?.[0]?.message?.content ??
        data?.content ??
        "Réponse indisponible.";

      const parsed = parseGuideResponse(
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );

      const targetField =
        parsed.field && parsed.field !== "none" ? parsed.field : field;
      const normalized = (parsed.fieldValue || prompt).trim();
      const updatedDraft: ChangeRequestGuideDraft = {
        ...crGuideDraft,
        [targetField]: normalized,
      };

      setCrGuideDraft(updatedDraft);

      setCrGuideStepIndex((prev) =>
        Math.min(prev + 1, CHANGE_REQUEST_GUIDE_ORDER.length)
      );

      applyGuideToForm(updatedDraft);

      const reply =
        parsed.assistantReply ||
        `Bien reçu pour ${CHANGE_REQUEST_GUIDE_LABEL[targetField]}.`;
      const next =
        parsed.nextQuestion ||
        (crGuideStepIndex + 1 >= CHANGE_REQUEST_GUIDE_ORDER.length
          ? "Parfait, on a les éléments clés. Clique sur “Appliquer au formulaire” puis soumets la request."
          : "Continue avec le prochain point pour compléter la request.");

      setCrGuideMessages((prev) => [
        ...prev,
        { role: "assistant", content: `${reply}\n\n${next}` },
      ]);
    } catch (error) {
      setCrGuideError(
        error instanceof Error ? error.message : "assistant_chat_unavailable"
      );

      const fallbackDraft: ChangeRequestGuideDraft = {
        ...crGuideDraft,
        [field]: prompt,
      };
      setCrGuideDraft(fallbackDraft);
      setCrGuideStepIndex((prev) =>
        Math.min(prev + 1, CHANGE_REQUEST_GUIDE_ORDER.length)
      );
      setCrGuideMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je n’ai pas pu reformuler automatiquement cette réponse. Je l’ai quand même prise en compte, tu peux continuer.",
        },
      ]);
      applyGuideToForm(fallbackDraft);
    } finally {
      setCrGuideLoading(false);
    }
  }

  async function handleUserRoleChange(
    id: string,
    role: AdminUserRecord["role"]
  ) {
    await updateAdminUser.mutateAsync({ id, role });
  }

  async function handleUserStatusChange(
    id: string,
    status: AdminUserRecord["status"]
  ) {
    await updateAdminUser.mutateAsync({ id, status });
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newAdminUser.email?.trim() || "";
    if (!email) return;

    await createAdminUser.mutateAsync({
      email,
      displayName: newAdminUser.displayName?.trim() || undefined,
      role: newAdminUser.role,
      status: newAdminUser.status,
      twoFactorEnabled: newAdminUser.twoFactorEnabled,
    });

    setNewAdminUser({
      email: "",
      displayName: "",
      role: "user",
      status: "active",
      twoFactorEnabled: false,
    });
  }

  async function handleDeleteUser(id: string) {
    const confirmed = window.confirm(
      "Supprimer cet utilisateur du répertoire admin ?"
    );
    if (!confirmed) return;
    await deleteAdminUser.mutateAsync({ id });
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
          `${newRequest.problem} ${crGuideDraft.impact}`
        ),
      },
      {
        label: "Critères de succès mesurables",
        ok: /%|ms|slo|sla|kpi|p95|objectif|mesurable|test/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.successCriteria}`
        ),
      },
      {
        label: "Plan de rollback / mitigation",
        ok: /rollback|revert|fallback|mitigation/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.rollbackPlan}`
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
    crGuideDraft.impact,
    crGuideDraft.successCriteria,
    crGuideDraft.rollbackPlan,
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

  const workflowRunMonitoring = useMemo(() => {
    const items = changeRequests.data?.items ?? [];
    const nowIso = new Date().toISOString();

    const runs = items
      .map((item) => {
        const runState = runStateFromStatus(item.status);
        const totalStages = item.workflow?.length ?? 0;
        const doneStages = (item.workflow ?? []).filter(
          (stage) => stage.status === "done"
        ).length;
        const progressPct =
          totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;
        const currentStage =
          (item.workflow ?? []).find((stage) => stage.status === "active") ??
          (item.workflow ?? [])[Math.max(0, doneStages - 1)] ??
          null;
        const startedAt = item.takenInChargeAt || item.createdAt;
        const elapsedMinutes = minutesBetween(startedAt, nowIso);
        const latestEvent = (item.workflowEvents ?? [])
          .slice()
          .sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
          )[0];
        const lastEventAt = latestEvent?.at || item.updatedAt;
        const lastEventAgeMinutes = minutesBetween(lastEventAt, nowIso);
        const executionState = item.executionState ?? "idle";
        const executionHeartbeatAt = item.executionLastHeartbeatAt || null;
        const executionHeartbeatAgeMinutes = minutesBetween(
          executionHeartbeatAt || undefined,
          nowIso
        );
        const hasExecutionSignal =
          executionState === "running" ||
          executionState === "success" ||
          executionState === "failed";
        const appearsWorkflowOnly =
          runState === "running" &&
          (executionState === "idle" || executionState === "queued") &&
          (executionHeartbeatAgeMinutes === null ||
            executionHeartbeatAgeMinutes > 5);

        return {
          item,
          runState,
          totalStages,
          doneStages,
          progressPct,
          currentStage,
          elapsedMinutes,
          lastEventAt,
          lastEventAgeMinutes,
          executionState,
          executionHeartbeatAt,
          executionHeartbeatAgeMinutes,
          hasExecutionSignal,
          appearsWorkflowOnly,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime()
      );

    return {
      runs,
      running: runs.filter((run) => run.runState === "running").length,
      queued: runs.filter((run) => run.runState === "queued").length,
      completed: runs.filter((run) => run.runState === "completed").length,
      failed: runs.filter((run) => run.runState === "failed").length,
      workflowOnlyRunning: runs.filter((run) => run.appearsWorkflowOnly).length,
    };
  }, [changeRequests.data?.items]);

  useEffect(() => {
    if (!workflowRunMonitoring.runs.length) {
      setSelectedRunId(null);
      return;
    }

    if (
      selectedRunId &&
      workflowRunMonitoring.runs.some((run) => run.item.id === selectedRunId)
    ) {
      return;
    }

    const preferred =
      workflowRunMonitoring.runs.find((run) => run.runState === "running") ||
      workflowRunMonitoring.runs.find((run) => run.runState === "queued") ||
      workflowRunMonitoring.runs[0];

    setSelectedRunId(preferred.item.id);
  }, [workflowRunMonitoring.runs, selectedRunId]);

  const selectedWorkflowRun = useMemo(() => {
    if (!workflowRunMonitoring.runs.length) return null;
    return (
      workflowRunMonitoring.runs.find((run) => run.item.id === selectedRunId) ||
      workflowRunMonitoring.runs[0]
    );
  }, [workflowRunMonitoring.runs, selectedRunId]);

  const selectedWorkflowRunEvents = useMemo(() => {
    if (!selectedWorkflowRun) return [];
    return (selectedWorkflowRun.item.workflowEvents ?? [])
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);
  }, [selectedWorkflowRun]);

  const changeRequestMonitoring = useMemo(() => {
    const items = changeRequests.data?.items ?? [];
    const nowIso = new Date().toISOString();

    const taken = items.filter((item) => !!item.takenInChargeAt);
    const triageMinutes = taken
      .map((item) => minutesBetween(item.createdAt, item.takenInChargeAt))
      .filter((v): v is number => v !== null);

    const avgTriageMinutes = triageMinutes.length
      ? Math.round(
          triageMinutes.reduce((acc, value) => acc + value, 0) /
            triageMinutes.length
        )
      : null;

    const wip = items.filter(
      (item) => item.status !== "released" && item.status !== "rejected"
    ).length;

    const stalled = items
      .map((item) => ({
        item,
        ageMinutes: minutesBetween(item.updatedAt, nowIso) ?? 0,
      }))
      .filter((entry) => entry.item.status !== "released")
      .sort((a, b) => b.ageMinutes - a.ageMinutes)
      .slice(0, 3);

    const latestEvents = items
      .flatMap((item) =>
        (item.workflowEvents ?? []).map((event) => ({
          ...event,
          requestId: item.id,
          requestTitle: item.title,
        }))
      )
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);

    return {
      total: items.length,
      wip,
      takenCount: taken.length,
      avgTriageMinutes,
      stalled,
      latestEvents,
    };
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
              ["deliverability-ops", "Deliverability Ops"],
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

      {activeTab === "deliverability-ops" && (
        <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#E4E4E7]">
                Procédure délivrabilité (checklist + automation)
              </h2>
              <p className="mt-1 text-xs text-[#71717A]">
                Pilotage DMARC/SPF/DKIM/Gmail policy avec statuts, rappels et CTAs.
              </p>
            </div>
            <Badge tone={procedureSaving ? "warn" : "ok"}>
              {procedureSaving ? "saving" : deliverabilityProcedure?.overall_status ?? "live"}
            </Badge>
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Progression</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(deliverabilityProcedure?.progress?.done ?? 0)} / {asInt(deliverabilityProcedure?.progress?.total ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Rappel</p>
              <p>
                {deliverabilityProcedure?.reminder?.enabled ? "activé" : "désactivé"} · every {deliverabilityProcedure?.reminder?.cadence_hours ?? 24}h
              </p>
              <p className="mt-1 text-[#71717A]">
                next: {deliverabilityProcedure?.reminder?.next_due_at ? asDate(deliverabilityProcedure.reminder.next_due_at) : "—"}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Auto-checks</p>
              <p>
                {(deliverabilityProcedure?.automation?.auto_checks ?? []).join(" · ") || "dns_txt · smtp_events · security_alerts"}
              </p>
            </article>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={procedureSaving}
              onClick={() =>
                void saveProcedureUpdate({
                  reminder: {
                    enabled: !(deliverabilityProcedure?.reminder?.enabled ?? true),
                    cadence_hours: deliverabilityProcedure?.reminder?.cadence_hours ?? 24,
                  },
                })
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-3 py-1.5 text-xs text-[#D4D4D8] hover:border-[#3A3A42]"
            >
              {deliverabilityProcedure?.reminder?.enabled ? "Désactiver rappel" : "Activer rappel"}
            </button>
            <button
              type="button"
              disabled={procedureSaving}
              onClick={() =>
                void saveProcedureUpdate({
                  reminder: {
                    enabled: deliverabilityProcedure?.reminder?.enabled ?? true,
                    cadence_hours:
                      (deliverabilityProcedure?.reminder?.cadence_hours ?? 24) === 24 ? 48 : 24,
                  },
                })
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-3 py-1.5 text-xs text-[#D4D4D8] hover:border-[#3A3A42]"
            >
              Basculer cadence 24h/48h
            </button>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Checklist opérateur
              </h3>
              <div className="mt-3 space-y-2">
                {(deliverabilityProcedure?.checklist ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#E4E4E7]">{item.title}</p>
                      <Badge
                        tone={
                          item.status === "done" || item.status === "done_manual"
                            ? "ok"
                            : item.status === "blocked"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#A1A1AA]">{item.evidence ?? "—"}</p>
                    {item.operator_note && (
                      <p className="mt-1 text-xs text-[#86EFAC]">note: {item.operator_note}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={procedureSaving}
                        onClick={() =>
                          void saveProcedureUpdate({
                            checklist: [{ id: item.id, checked: true }],
                          })
                        }
                        className="rounded-md border border-[#355D3A] bg-[#132016] px-2 py-1 text-[11px] text-[#86EFAC]"
                      >
                        Marquer fait
                      </button>
                      {item.cta?.details && (
                        <code className="rounded bg-[#1A1A1F] px-2 py-1 text-[11px] text-[#D4D4D8]">
                          {item.cta.details}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                CTAs détaillées
              </h3>
              <div className="mt-3 space-y-2 text-xs text-[#D4D4D8]">
                {(deliverabilityProcedure?.cta_details ?? []).map((cta) => (
                  <div
                    key={cta.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <p className="text-sm text-[#E4E4E7]">{cta.label}</p>
                    <p className="mt-1 text-[#A1A1AA]">{cta.description}</p>
                  </div>
                ))}
                {!deliverabilityProcedure?.cta_details?.length && (
                  <p className="text-[#71717A]">Aucune CTA détaillée disponible.</p>
                )}
              </div>
            </article>
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

          <div className="mb-3 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
            <p className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Déploiement requis
            </p>
            <p className="mt-1 text-[#E5E7EB]">
              Une CR peut passer en &quot;implémentée&quot; côté workflow, mais
              les changements code (misfits-web / reimagined-guide) nécessitent
              merge + redémarrage/déploiement des services concernés pour être
              visibles.
            </p>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Console backend (source de vérité)
                </h3>
                <Badge tone={adminDataLoading ? "warn" : "ok"}>
                  {adminDataLoading ? "syncing" : "live"}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-[#A1A1AA]">
                Preuves backend de l&apos;activité réelle (queue, débit,
                erreurs), distinctes du simple statut workflow.
              </p>
              <div className="mt-2 grid gap-2 text-[11px] md:grid-cols-3">
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  queue depth:{" "}
                  {asInt(observability?.health_realtime?.queue?.depth ?? 0)}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  in/out min:{" "}
                  {observability?.health_realtime?.throughput?.incoming_per_min?.toFixed(
                    1
                  ) ?? "0.0"}
                  /
                  {observability?.health_realtime?.throughput?.outgoing_per_min?.toFixed(
                    1
                  ) ?? "0.0"}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  smtp 5xx:{" "}
                  {percent(
                    observability?.health_realtime?.delivery?.smtp_5xx_rate ?? 0
                  )}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#A1A1AA]">
                <p>
                  success rate:{" "}
                  {percent(
                    observability?.health_realtime?.delivery?.success_rate ?? 0
                  )}{" "}
                  · p95:{" "}
                  {asInt(
                    observability?.health_realtime?.delivery?.p95_total_ms ?? 0
                  )}{" "}
                  ms
                </p>
                <p>
                  alerts queue/auth:{" "}
                  {asInt(
                    observability?.proactive_alerting?.threshold_alerts
                      ?.queue_growth ?? 0
                  )}
                  /
                  {asInt(
                    observability?.proactive_alerting?.threshold_alerts
                      ?.auth_failures ?? 0
                  )}
                </p>
                {adminDataError && (
                  <p className="mt-1 text-[#FCA5A5]">
                    backend indisponible: {adminDataError}
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">CR totales</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.total)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">En cours</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.wip)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">Prises en charge</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.takenCount)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">
                Délai moyen prise en charge
              </p>
              <p className="mt-1 text-sm font-semibold text-[#E4E4E7]">
                {formatDurationMinutes(
                  changeRequestMonitoring.avgTriageMinutes
                )}
              </p>
            </article>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-2">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Dernières prises en charge / transitions
              </h3>
              <div className="mt-2 space-y-2">
                {changeRequestMonitoring.latestEvents.map((event) => (
                  <div
                    key={`${event.requestId}-${event.at}-${event.action}`}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <p className="text-xs text-[#E4E4E7]">
                      {event.requestId} · {event.fromStatus} → {event.toStatus}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA]">
                      {event.actor} · {asDate(event.at)}
                    </p>
                    {event.note && (
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        {event.note}
                      </p>
                    )}
                  </div>
                ))}
                {!changeRequestMonitoring.latestEvents.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucun événement workflow pour le moment.
                  </p>
                )}
              </div>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                État des lieux (CR les plus anciennes)
              </h3>
              <div className="mt-2 space-y-2">
                {changeRequestMonitoring.stalled.map(({ item, ageMinutes }) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#E4E4E7]">{item.id}</p>
                      <Badge tone={statusTone(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-[#A1A1AA]">
                      Inactif depuis {formatDurationMinutes(ageMinutes)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#71717A]">
                      prise en charge: {item.takenInChargeBy || "—"} ·{" "}
                      {asDate(item.takenInChargeAt || "")}
                    </p>
                  </div>
                ))}
                {!changeRequestMonitoring.stalled.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucune CR en attente prolongée.
                  </p>
                )}
              </div>
            </article>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Runs workflow
                </h3>
                <Badge tone={workflowRunMonitoring.running ? "ok" : "neutral"}>
                  {workflowRunMonitoring.running} running
                </Badge>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#A1A1AA]">
                  queued: {asInt(workflowRunMonitoring.queued)}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#A1A1AA]">
                  failed: {asInt(workflowRunMonitoring.failed)}
                </div>
              </div>

              {workflowRunMonitoring.workflowOnlyRunning > 0 && (
                <div className="mb-2 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
                  {workflowRunMonitoring.workflowOnlyRunning} run(s) en statut
                  running sans signal d&apos;exécution technique récent.
                </div>
              )}

              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {workflowRunMonitoring.runs.map((run) => (
                  <button
                    key={run.item.id}
                    type="button"
                    onClick={() => setSelectedRunId(run.item.id)}
                    className={cn(
                      "w-full rounded-lg border p-2 text-left",
                      selectedWorkflowRun?.item.id === run.item.id
                        ? "border-[#C49B66] bg-[#2A2218]"
                        : "border-[#2A2A30] bg-[#111114] hover:border-[#3A3A42]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-[#E4E4E7]">
                        {run.item.id}
                      </p>
                      <Badge tone={runStateTone(run.runState)}>
                        {runStateLabel(run.runState)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-[#A1A1AA]">
                      {run.item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[#71717A]">
                      stage: {run.currentStage?.label || "—"} · {run.doneStages}
                      /{run.totalStages}
                    </p>
                    <p className="text-[11px] text-[#71717A]">
                      elapsed: {formatDurationMinutes(run.elapsedMinutes)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px]",
                        run.appearsWorkflowOnly
                          ? "text-[#FCD34D]"
                          : "text-[#86EFAC]"
                      )}
                    >
                      {run.appearsWorkflowOnly
                        ? "signal: workflow uniquement"
                        : "signal: activité technique détectée"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={executionStateTone(run.executionState)}>
                        exec {executionStateLabel(run.executionState)}
                      </Badge>
                      {run.item.executionRunId && (
                        <span className="text-[10px] text-[#71717A]">
                          run {run.item.executionRunId}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!workflowRunMonitoring.runs.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucun run disponible.
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Run details (style GitHub Actions)
                </h3>
                {selectedWorkflowRun && (
                  <Badge tone={runStateTone(selectedWorkflowRun.runState)}>
                    {selectedWorkflowRun.item.id} ·{" "}
                    {runStateLabel(selectedWorkflowRun.runState)}
                  </Badge>
                )}
              </div>

              {selectedWorkflowRun ? (
                <>
                  <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#E4E4E7]">
                        {selectedWorkflowRun.item.title}
                      </p>
                      <p className="text-[11px] text-[#A1A1AA]">
                        updated {asDate(selectedWorkflowRun.item.updatedAt)}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#232327]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          selectedWorkflowRun.runState === "failed"
                            ? "bg-[#FCA5A5]"
                            : selectedWorkflowRun.runState === "completed"
                              ? "bg-[#86EFAC]"
                              : "bg-[#F2D5A7]"
                        )}
                        style={{ width: `${selectedWorkflowRun.progressPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#A1A1AA]">
                      progress {selectedWorkflowRun.progressPct}% · stage actif:{" "}
                      {selectedWorkflowRun.currentStage?.label || "—"} · elapsed{" "}
                      {formatDurationMinutes(
                        selectedWorkflowRun.elapsedMinutes
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#A1A1AA]">
                      <Badge
                        tone={executionStateTone(
                          selectedWorkflowRun.executionState
                        )}
                      >
                        execution{" "}
                        {executionStateLabel(
                          selectedWorkflowRun.executionState
                        )}
                      </Badge>
                      <span>
                        heartbeat:{" "}
                        {asDate(selectedWorkflowRun.executionHeartbeatAt || "")}
                      </span>
                      {selectedWorkflowRun.item.executionLastError && (
                        <span className="text-[#FCA5A5]">
                          error: {selectedWorkflowRun.item.executionLastError}
                        </span>
                      )}
                    </div>

                    {selectedWorkflowRun.appearsWorkflowOnly && (
                      <div className="mt-2 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
                        Statut &quot;running&quot; détecté, mais aucun signal de
                        build/test/deploy récent. Cette CR semble en
                        orchestration workflow uniquement.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedWorkflowRun.item.status === "submitted" ||
                        selectedWorkflowRun.item.status === "triaged" ||
                        selectedWorkflowRun.item.status === "planned") && (
                        <button
                          type="button"
                          className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
                          disabled={
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleStartImplementation(
                              selectedWorkflowRun.item.id,
                              selectedWorkflowRun.item.status
                            )
                          }
                        >
                          relancer run
                        </button>
                      )}
                      {(selectedWorkflowRun.item.status === "in_progress" ||
                        selectedWorkflowRun.item.status === "qa") && (
                        <button
                          type="button"
                          className="rounded-md border border-[#4A3B1F] bg-[#2B2210] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                          disabled={
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(
                              selectedWorkflowRun.item.id,
                              "stop",
                              selectedWorkflowRun.item.status
                            )
                          }
                        >
                          stop run
                        </button>
                      )}
                      {selectedWorkflowRun.item.status !== "released" &&
                        selectedWorkflowRun.item.status !== "rejected" && (
                          <button
                            type="button"
                            className="rounded-md border border-[#5E4A20] bg-[#2B2413] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "cancel",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            cancel run
                          </button>
                        )}
                      {(selectedWorkflowRun.item.status === "in_progress" ||
                        selectedWorkflowRun.item.status === "qa") && (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_start",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler start backend
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_heartbeat",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            heartbeat
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_success",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler success
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#5B1F27] bg-[#2B1419] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_fail",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler échec
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-3 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
                      <p className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Déploiement requis
                      </p>
                      <p className="mt-1 text-[#E5E7EB]">
                        Les transitions CR pilotent le workflow produit, mais
                        les changements de code (misfits-web / reimagined-guide)
                        ne sont visibles qu&apos;après merge +
                        déploiement/restart des services concernés.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
                      <p className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                        Jobs
                      </p>
                      <div className="mt-2 space-y-2">
                        {(selectedWorkflowRun.item.workflow ?? []).map(
                          (stage) => (
                            <div
                              key={stage.key}
                              className="rounded-md border border-[#2A2A30] bg-[#151518] p-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-[#E4E4E7]">
                                  {stage.label}
                                </p>
                                <Badge
                                  tone={
                                    stage.status === "done"
                                      ? "ok"
                                      : stage.status === "active"
                                        ? "warn"
                                        : "neutral"
                                  }
                                >
                                  {stage.status}
                                </Badge>
                              </div>
                              <p className="mt-1 text-[11px] text-[#71717A]">
                                owner: {stage.owner} · done:{" "}
                                {asDate(stage.doneAt || "")}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
                      <p className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                        Logs (latest 20)
                      </p>
                      <div className="mt-2 max-h-[280px] space-y-1 overflow-y-auto rounded-md border border-[#2A2A30] bg-[#0D0D10] p-2 font-mono text-[11px]">
                        {selectedWorkflowRunEvents.map((event) => (
                          <div
                            key={`${event.at}-${event.action}-${event.fromStatus}`}
                          >
                            <span className="text-[#71717A]">
                              {asDate(event.at)}
                            </span>{" "}
                            <span className="text-[#E4E4E7]">
                              {event.actor}
                            </span>{" "}
                            <span className="text-[#F2D5A7]">
                              {event.action}
                            </span>{" "}
                            <span className="text-[#A1A1AA]">
                              {event.fromStatus}→{event.toStatus}
                            </span>
                            {event.note ? (
                              <span className="text-[#86EFAC]">
                                {" "}
                                · {event.note}
                              </span>
                            ) : null}
                          </div>
                        ))}
                        {!selectedWorkflowRunEvents.length && (
                          <p className="text-[#71717A]">
                            Aucun log pour ce run.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#71717A]">
                  Sélectionne un run pour voir son exécution détaillée.
                </p>
              )}
            </article>
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
                disabled={
                  createChangeRequest.isPending || qualityChecks.score < 4
                }
              >
                {createChangeRequest.isPending
                  ? "Création..."
                  : "Créer et lancer le workflow"}
              </button>
              {qualityChecks.score < 4 && (
                <p className="mt-2 text-xs text-[#FCD34D]">
                  Complète au moins 4/5 critères qualité via l&apos;assistant
                  chat avant soumission.
                </p>
              )}
            </form>

            <aside className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Assistant chat — formulation CR
                </h3>
                <Badge tone={qualityChecks.score >= 4 ? "ok" : "warn"}>
                  qualité {qualityChecks.score}/5
                </Badge>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Discute avec Hermes pour structurer la demande. Il reformule et
                alimente automatiquement le formulaire.
              </p>

              <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
                {crGuideMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "max-w-[92%] rounded-md px-2 py-1.5 text-xs leading-relaxed",
                      message.role === "assistant"
                        ? "border border-[#2A2A30] bg-[#151518] text-[#D4D4D8]"
                        : "ml-auto border border-[#4A3921] bg-[#2A2218] text-[#F2D5A7]"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form className="mt-2 space-y-2" onSubmit={handleGuideChatSubmit}>
                <textarea
                  value={crGuideInput}
                  onChange={(e) => setCrGuideInput(e.target.value)}
                  className="h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="Réponds au message Hermes (ex: impact, KPI, rollback, etc.)"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={crGuideLoading || !crGuideInput.trim()}
                    className="rounded-lg border border-[#C49B66] bg-[#2A2218] px-2.5 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
                  >
                    {crGuideLoading ? "Hermes rédige…" : "Envoyer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGuideToForm()}
                    className="rounded-lg border border-[#3A3A42] px-2.5 py-1.5 text-xs text-[#D4D4D8]"
                  >
                    Appliquer au formulaire
                  </button>
                </div>
                {crGuideError && (
                  <p className="text-xs text-[#FCA5A5]">
                    Assistant indisponible: {crGuideError}
                  </p>
                )}
              </form>

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
                      <p className="mt-1 text-[11px] text-[#A1A1AA]">
                        prise en charge: {item.takenInChargeBy || "—"} ·{" "}
                        {asDate(item.takenInChargeAt || "")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-[#3A3A42] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                          disabled={
                            item.status === "released" ||
                            item.status === "rejected" ||
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(
                              item.id,
                              "advance",
                              item.status
                            )
                          }
                        >
                          Advance
                        </button>
                        {(item.status === "submitted" ||
                          item.status === "triaged" ||
                          item.status === "planned") && (
                          <button
                            type="button"
                            className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleStartImplementation(
                                item.id,
                                item.status
                              )
                            }
                          >
                            {startImplementationChangeRequest.isPending
                              ? "Lancement..."
                              : "Lancer implémentation"}
                          </button>
                        )}
                        {(item.status === "in_progress" ||
                          item.status === "qa") && (
                          <button
                            type="button"
                            className="rounded-md border border-[#4A3B1F] bg-[#2B2210] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                item.id,
                                "stop",
                                item.status
                              )
                            }
                          >
                            Arrêter
                          </button>
                        )}
                        {item.status !== "released" &&
                          item.status !== "rejected" && (
                            <button
                              type="button"
                              className="rounded-md border border-[#5E4A20] bg-[#2B2413] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                              disabled={
                                transitionChangeRequest.isPending ||
                                startImplementationChangeRequest.isPending ||
                                deleteChangeRequest.isPending
                              }
                              onClick={() =>
                                void handleTransition(
                                  item.id,
                                  "cancel",
                                  item.status
                                )
                              }
                            >
                              Annuler
                            </button>
                          )}
                        <button
                          type="button"
                          className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                          disabled={
                            item.status === "released" ||
                            item.status === "rejected" ||
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(
                              item.id,
                              "reject",
                              item.status
                            )
                          }
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-[#60292F] bg-[#2A1418] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                          disabled={
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleDeleteChangeRequest(item.id)
                          }
                        >
                          {deleteChangeRequest.isPending
                            ? "Suppression..."
                            : "Supprimer"}
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

          {rbacEnforced && !canWriteUsers && (
            <div className="mb-4 rounded-xl border border-[#5B4A1F] bg-[#2A2513] p-3">
              <p className="text-xs font-medium text-[#F5C563]">
                Lecture seule — rôle: {whoami.data?.role ?? "viewer"}
              </p>
              <p className="mt-1 text-[11px] text-[#D4D4D8]">
                Vous consultez la liste des utilisateurs. Les actions
                création, modification et suppression sont réservées au rôle
                admin.
              </p>
            </div>
          )}

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

          {canWriteUsers && (
          <form
            onSubmit={(e) => void handleCreateUser(e)}
            className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3"
          >
            <p className="text-xs text-[#A1A1AA]">Créer un utilisateur</p>
            <div className="mt-2 grid gap-2 md:grid-cols-5">
              <input
                value={newAdminUser.email}
                onChange={(e) =>
                  setNewAdminUser((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
                type="email"
                className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
                placeholder="email@misfits.ai"
              />
              <input
                value={newAdminUser.displayName || ""}
                onChange={(e) =>
                  setNewAdminUser((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
                placeholder="Nom affiché"
              />
              <select
                value={newAdminUser.role}
                onChange={(e) =>
                  setNewAdminUser((prev) => ({
                    ...prev,
                    role: e.target.value as AdminUserRecord["role"],
                  }))
                }
                className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
              >
                <option value="user">user</option>
                <option value="support">support</option>
                <option value="admin">admin</option>
              </select>
              <select
                value={newAdminUser.status}
                onChange={(e) =>
                  setNewAdminUser((prev) => ({
                    ...prev,
                    status: e.target.value as AdminUserRecord["status"],
                  }))
                }
                className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
              >
                <option value="active">active</option>
                <option value="restricted">restricted</option>
              </select>
              <button
                type="submit"
                disabled={createAdminUser.isPending}
                className="rounded-lg border border-[#3A3A42] px-2 py-1.5 text-xs text-[#E4E4E7] disabled:opacity-50"
              >
                {createAdminUser.isPending ? "Création..." : "Créer"}
              </button>
            </div>
          </form>
          )}

          <div className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-[#A1A1AA]">Activité IA</p>
              <Badge tone={adminAiActivity.isFetching ? "warn" : "ok"}>
                {adminAiActivity.isFetching ? "syncing" : "live"}
              </Badge>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              <p className="text-xs text-[#D4D4D8]">
                Runs: {asInt(adminAiActivity.data?.metrics.totalRuns ?? 0)}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                Success:{" "}
                {percent(adminAiActivity.data?.metrics.successRate ?? 0)}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                Tokens: {asInt(adminAiActivity.data?.metrics.totalTokens ?? 0)}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                Prompt/Completion:{" "}
                {asInt(adminAiActivity.data?.metrics.promptTokens ?? 0)} /{" "}
                {asInt(adminAiActivity.data?.metrics.completionTokens ?? 0)}
              </p>
              <p className="text-xs text-[#D4D4D8]">
                Latence avg/p95:{" "}
                {asInt(adminAiActivity.data?.metrics.avgLatencyMs ?? 0)}ms /{" "}
                {asInt(adminAiActivity.data?.metrics.p95LatencyMs ?? 0)}ms
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {(adminAiActivity.data?.runs ?? []).slice(0, 6).map((run) => (
                <p key={run.id} className="text-[11px] text-[#A1A1AA]">
                  {asDate(run.startedAt || "")} · {run.status} · {run.model} ·
                  tok={asInt(run.totalTokens)} · {asInt(run.latencyMs ?? 0)}ms
                </p>
              ))}
            </div>
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
                    <select
                      value={user.status}
                      onChange={(e) =>
                        void handleUserStatusChange(
                          user.id,
                          e.target.value as AdminUserRecord["status"]
                        )
                      }
                      disabled={updateAdminUser.isPending || !canWriteUsers}
                      className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
                    >
                      <option value="active">active</option>
                      <option value="restricted">restricted</option>
                    </select>
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
                      disabled={updateAdminUser.isPending || !canWriteUsers}
                      className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
                    >
                      <option value="user">user</option>
                      <option value="support">support</option>
                      <option value="admin">admin</option>
                    </select>
                    {canWriteUsers && (
                    <button
                      type="button"
                      onClick={() => inviteAdminUser.mutate(user.id)}
                      disabled={inviteAdminUser.isPending}
                      className="rounded-md border border-[#1F3B5B] px-2 py-1 text-[11px] text-[#93C5FD] disabled:opacity-50"
                      title="Envoyer un lien d'invitation à cet utilisateur (72h)"
                    >
                      Inviter
                    </button>
                    )}
                    {canWriteUsers && (
                    <button
                      type="button"
                      onClick={() => {
                        const p = window.prompt(
                          "Nouveau mot de passe (laisser vide pour générer)",
                          ""
                        );
                        if (p === null) return; // annulé
                        resetAdminPassword.mutate({
                          id: user.id,
                          newPassword: p.trim() || undefined,
                          revokeSessions: true,
                        });
                      }}
                      disabled={resetAdminPassword.isPending}
                      className="rounded-md border border-[#3B4A1F] px-2 py-1 text-[11px] text-[#BEF264] disabled:opacity-50"
                      title="Réinitialiser le mot de passe et révoquer les sessions"
                    >
                      Reset MDP
                    </button>
                    )}
                    {canWriteUsers && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteUser(user.id)}
                      disabled={deleteAdminUser.isPending}
                      className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                    )}
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
            {adminAiActivity.isError && (
              <p className="text-sm text-[#FCA5A5]">
                Erreur activité IA: {adminAiActivity.error.message}
              </p>
            )}

            <div className="mt-4 rounded-xl border border-[#232327] bg-[#151518] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-[#A1A1AA]">
                  Journal d&apos;audit (100 dernières actions)
                </p>
                <Badge tone={adminAuditLog.isFetching ? "warn" : "ok"}>
                  {adminAuditLog.isFetching ? "syncing" : "live"}
                </Badge>
              </div>
              {adminAuditLog.data?.entries?.length ? (
                <ul className="space-y-1 text-[11px] text-[#D4D4D8]">
                  {adminAuditLog.data.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-[#111114] px-2 py-1"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-[#71717A]">
                          {new Date(entry.at).toLocaleString()}
                        </span>{" "}
                        <span className="font-mono text-[#93C5FD]">
                          {entry.actorEmail}
                        </span>{" "}
                        →{" "}
                        <span className="text-[#F5C563]">{entry.action}</span>{" "}
                        <span className="text-[#71717A]">
                          {entry.targetKind}:{entry.targetId}
                        </span>
                        {entry.note ? (
                          <span className="text-[#A1A1AA]"> · {entry.note}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#71717A]">
                  Aucune entrée pour le moment.
                </p>
              )}
              {adminAuditLog.isError && (
                <p className="text-sm text-[#FCA5A5]">
                  Erreur audit-log: {adminAuditLog.error.message}
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
