"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Activity, ShieldCheck, Clock3 } from "lucide-react";
import {
  useMonitoringAlerts,
  useMonitoringBounces,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary
} from "@/hooks/use-monitoring";
import {
  useSecurityActiveAlerts,
  useSecurityIncidents,
  useSecurityLive
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
  useUpdateAdminUser
} from "@/hooks/use-admin-ops";
import type {
  ChangeRequestItem,
  CreateAdminUserInput,
  CreateChangeRequestInput,
  WorkflowStatus,
  AdminUserRecord} from "@/types/admin-ops";
import {
  Badge,
  asDate,
  asInt,
  percent,
  minutesBetween,
  formatDurationMinutes,
  priorityTone,
  statusTone,
  runStateFromStatus,
  runStateTone,
  runStateLabel,
  executionStateTone,
  executionStateLabel
} from "./shared";
import { ChangelogTab } from "./tabs/ChangelogTab";
import { DeliverabilityOpsTab } from "./tabs/DeliverabilityOpsTab";
import { AdminOverviewSections, type LocalSecurityPosture, type LocalObservabilityOverview } from "./tabs/AdminOverviewSections";
import { UsersTab } from "./tabs/UsersTab";
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
  rejected: "Rejetée"
};


type AdminDeliverabilityDiagnosticsResponse = {
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

type DeliverabilityProcedureData = {
  overall_status?: string;
  domain?: string;
  window?: string;
  progress?: { done?: number; total?: number };
  reminder?: { enabled?: boolean; cadence_hours?: number; next_due_at?: string };
  checklist?: Array<{
    id: string;
    title: string;
    status: "done" | "done_manual" | "in_progress" | "todo" | "blocked";
    evidence?: string;
    operator_note?: string;
    cta?: { label?: string; kind?: string; details?: string };
  }>;
  cta_details?: Array<{ id: string; label: string; description: string }>;
  automation?: { auto_checks?: string[]; last_computed_at?: string };
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
  rollbackPlan: "plan de rollback/mitigation"
};

export function AdminConsolePage({
  initialTab = "overview"
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
    enabled: activeTab !== "changelog"
  });

  const securitySeverityFilter = severity === "all" ? undefined : severity;
  const securityActive = useSecurityActiveAlerts({
    window: windowRange,
    severity: securitySeverityFilter
  });
  const securityIncidents = useSecurityIncidents({
    page: 1,
    page_size: 20,
    severity: securitySeverityFilter
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
    linkedRepo: "cross-repo"
  });
  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    displayName: "",
    role: "user",
    status: "active",
    twoFactorEnabled: false
  });

  const [transitionNote, setTransitionNote] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [crGuideDraft, setCrGuideDraft] = useState<ChangeRequestGuideDraft>({
    problemRoot: "",
    impact: "",
    successCriteria: "",
    rollbackPlan: ""
  });
  const [crGuideStepIndex, setCrGuideStepIndex] = useState(0);
  const [crGuideMessages, setCrGuideMessages] = useState<
    ChangeRequestChatMessage[]
  >([
    {
      role: "assistant",
      content:
        "Je t’aide à remplir la change request. Commence par décrire le problème racine (symptôme + cause probable)."
    },
  ]);
  const [crGuideInput, setCrGuideInput] = useState("");
  const [crGuideLoading, setCrGuideLoading] = useState(false);
  const [crGuideError, setCrGuideError] = useState<string | null>(null);

  const [securityPosture, setSecurityPosture] =
    useState<LocalSecurityPosture | null>(null);
  const [deliverability, setDeliverability] =
    useState<AdminDeliverabilityDiagnosticsResponse | null>(null);
  const [deliverabilityProcedure, setDeliverabilityProcedure] =
    useState<DeliverabilityProcedureData | null>(null);
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
              cache: "no-store"
            }),
            fetch(
              `/api/admin/deliverability/diagnostics?window=${windowRange}`,
              {
                cache: "no-store"
              }
            ),
            fetch(`/api/admin/observability/overview?window=${windowRange}`, {
              cache: "no-store"
            }),
            fetch(`/api/admin/deliverability/procedure?window=${windowRange}`, {
              cache: "no-store"
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
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `procedure_update_failed_${res.status}`);
      }

      const fresh = await fetch(
        `/api/admin/deliverability/procedure?window=${windowRange}`,
        {
          cache: "no-store"
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
        icon: Activity
      },
      {
        label: "Bounce rate",
        value: summary ? percent(summary.bounce_rate) : "—",
        note: "Hard + soft bounce",
        icon: AlertTriangle
      },
      {
        label: "Alertes Monitoring",
        value: asInt(activeMonAlerts),
        note: `Fenêtre ${windowRange}`,
        icon: Clock3
      },
      {
        label: "Alertes Sécurité",
        value: asInt(activeSecAlerts),
        note: severity === "all" ? "Toutes sévérités" : severity,
        icon: ShieldCheck
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
      admin_data_error: adminDataError
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
                "Tu es Hermes, copilote SRE/DevOps de la console admin misfits.ai Mail. Réponds en français, de façon actionnable et concise. Donne exactement deux sections: 1) Résumé opérationnel (4-6 puces), 2) Actions à réaliser (checklist priorisée P0/P1/P2 avec commandes/étapes de vérification). Si des données sont absentes ou incohérentes, indique clairement les vérifications à lancer."
            },
            {
              role: "user",
              content: `Contexte observabilité/sécurité (JSON):\n${JSON.stringify(
                adminAssistantSnapshot
              )}\n\nDemande opérateur:\n${prompt}`
            },
          ],
          sessionId: "admin-console-operations",
          sessionKey: "misfits-admin-console",
          temperature: 0.2
        })
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
      desiredOutcome: ""
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
      actor: "hermes"
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
      actor: "hermes"
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
      desiredOutcome: fusedOutcome || prev.desiredOutcome
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
                'Tu es assistant de formulation de change request. Réponds strictement en JSON sans markdown: {"assistantReply":string,"field":"problemRoot"|"impact"|"successCriteria"|"rollbackPlan"|"none","fieldValue":string,"nextQuestion":string}. fieldValue doit reformuler la réponse utilisateur en version exploitable et concise. nextQuestion doit poser la prochaine question utile pour compléter le formulaire.'
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
                ).map((k) => CHANGE_REQUEST_GUIDE_LABEL[k])
              })
            },
          ],
          sessionId: "admin-change-request-guide",
          sessionKey: "misfits-admin-change-request-guide",
          temperature: 0.2
        })
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
        [targetField]: normalized
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
        [field]: prompt
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
            "Je n’ai pas pu reformuler automatiquement cette réponse. Je l’ai quand même prise en compte, tu peux continuer."
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
      twoFactorEnabled: newAdminUser.twoFactorEnabled
    });

    setNewAdminUser({
      email: "",
      displayName: "",
      role: "user",
      status: "active",
      twoFactorEnabled: false
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
        ok: newRequest.problem.trim().length >= 40
      },
      {
        label: "Impact utilisateur/business explicite",
        ok: /impact|client|utilisateur|business|latence|erreur/i.test(
          `${newRequest.problem} ${crGuideDraft.impact}`
        )
      },
      {
        label: "Critères de succès mesurables",
        ok: /%|ms|slo|sla|kpi|p95|objectif|mesurable|test/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.successCriteria}`
        )
      },
      {
        label: "Plan de rollback / mitigation",
        ok: /rollback|revert|fallback|mitigation/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.rollbackPlan}`
        )
      },
      {
        label: "Portée repo + priorité cohérentes",
        ok:
          (newRequest.linkedRepo === "cross-repo" &&
            newRequest.scope === "fullstack") ||
          newRequest.linkedRepo !== "cross-repo"
      },
    ];

    return {
      checks,
      score: checks.filter((c) => c.ok).length
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
          appearsWorkflowOnly
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
      workflowOnlyRunning: runs.filter((run) => run.appearsWorkflowOnly).length
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
        ageMinutes: minutesBetween(item.updatedAt, nowIso) ?? 0
      }))
      .filter((entry) => entry.item.status !== "released")
      .sort((a, b) => b.ageMinutes - a.ageMinutes)
      .slice(0, 3);

    const latestEvents = items
      .flatMap((item) =>
        (item.workflowEvents ?? []).map((event) => ({
          ...event,
          requestId: item.id,
          requestTitle: item.title
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
      latestEvents
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
        <AdminOverviewSections
          activeTab={activeTab as "overview" | "monitoring" | "security"}
          observability={observability as unknown as LocalObservabilityOverview}
          securityPosture={securityPosture}
          deliverability={deliverability}
          adminDataLoading={adminDataLoading}
          adminDataError={adminDataError}
          securityLive={securityLive}
          monitoringLive={monitoringLive}
          assistantLoading={assistantLoading}
          assistantPrompt={assistantPrompt}
          setAssistantPrompt={setAssistantPrompt}
          assistantAnswer={assistantAnswer}
          assistantError={assistantError}
          askHermesForAdminPlan={askHermesForAdminPlan}
          summaryCards={summaryCards}
          monitoringProviders={monitoringProviders.data?.providers ?? []}
          monitoringBounces={monitoringBounces.data?.bounces ?? []}
          securityActiveAlerts={securityActive.data?.alerts ?? []}
          securityIncidents={securityIncidents.data?.alerts ?? []}
        />
      )}
      {activeTab === "deliverability-ops" && (
        <DeliverabilityOpsTab
          procedureSaving={procedureSaving}
          deliverabilityProcedure={deliverabilityProcedure}
          deliverability={deliverability}
          saveProcedureUpdate={saveProcedureUpdate}
        />
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

          <div className="mb-3 grid gap-2 md:grid-cols-4">
            <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
              <p className="text-[11px] text-[#A1A1AA]">CR ouvertes</p>
              <p className="text-sm font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.total)}
              </p>
            </div>
            <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
              <p className="text-[11px] text-[#A1A1AA]">En cours</p>
              <p className="text-sm font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.wip)}
              </p>
            </div>
            <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
              <p className="text-[11px] text-[#A1A1AA]">Runs actifs</p>
              <p className="text-sm font-semibold text-[#E4E4E7]">
                {asInt(workflowRunMonitoring.running)}
              </p>
            </div>
            <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
              <p className="text-[11px] text-[#A1A1AA]">Triage moyen</p>
              <p className="text-sm font-semibold text-[#E4E4E7]">
                {formatDurationMinutes(changeRequestMonitoring.avgTriageMinutes)}
              </p>
            </div>
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
                      title: e.target.value
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
                      requestedBy: e.target.value
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
                        .value as CreateChangeRequestInput["scope"]
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
                        .value as CreateChangeRequestInput["urgency"]
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
                        .value as CreateChangeRequestInput["impact"]
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
                        .value as CreateChangeRequestInput["linkedRepo"]
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
                    problem: e.target.value
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
                    desiredOutcome: e.target.value
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
                          Étape suivante
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
                          Rejeter
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
        <UsersTab
          adminUsers={adminUsers}
          adminWhoami={whoami}
          adminAiActivity={adminAiActivity}
          adminAuditLog={adminAuditLog}
          createAdminUser={createAdminUser}
          inviteAdminUser={inviteAdminUser}
          resetAdminPassword={resetAdminPassword}
          deleteAdminUser={deleteAdminUser}
          updateAdminUser={updateAdminUser}
        />
      )}
    </div>
  );
}
