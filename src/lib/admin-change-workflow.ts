import type {
  ChangeRequestItem,
  CreateChangeRequestInput,
  WorkflowPriority,
  WorkflowStage,
  WorkflowStatus,
} from "@/types/admin-ops";

const WORKFLOW_ORDER: WorkflowStatus[] = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
];

const STORE_KEY = Symbol.for("misfits.admin.changeRequestsStore");

type GlobalStore = {
  items: ChangeRequestItem[];
};

function buildInitialStages(): WorkflowStage[] {
  return [
    {
      key: "discovery",
      label: "Discovery produit",
      owner: "product",
      status: "active",
      checklist: [
        "Clarifier le problème utilisateur",
        "Mesurer impact business/ops",
        "Valider la portée UX + Backend",
      ],
    },
    {
      key: "spec",
      label: "Spécification",
      owner: "backend",
      status: "pending",
      checklist: [
        "Définir contrat API + payload",
        "Définir telemetry & changelog",
      ],
    },
    {
      key: "build",
      label: "Implémentation",
      owner: "frontend",
      status: "pending",
      checklist: [
        "Implémenter UI/UX",
        "Implémenter endpoint backend",
        "Ajouter tests critiques",
      ],
    },
    {
      key: "qa",
      label: "Validation",
      owner: "qa",
      status: "pending",
      checklist: [
        "Typecheck + lint + tests",
        "Validation de non-régression admin",
      ],
    },
    {
      key: "release",
      label: "Rollout",
      owner: "ops",
      status: "pending",
      checklist: [
        "Publier changelog",
        "Surveiller métriques post-release",
        "Préparer rollback playbook",
      ],
    },
  ];
}

function nowIso(): string {
  return new Date().toISOString();
}

function computePriority(input: CreateChangeRequestInput): WorkflowPriority {
  if (input.urgency === "high" && input.impact === "high") return "P0";
  if (input.urgency === "high" || input.impact === "high") return "P1";
  return "P2";
}

function buildAcceptanceCriteria(input: CreateChangeRequestInput): string[] {
  const base = [
    "Le flux admin expose un état lisible de la demande",
    "Le backend retourne un état workflow déterministe",
    "Le changement apparaît dans le flux changelog une fois released",
  ];

  if (input.scope === "ux" || input.scope === "fullstack") {
    base.push("Parcours UX sans ambiguïté: soumission -> triage -> release");
  }

  if (input.scope === "backend" || input.scope === "fullstack") {
    base.push("Contrat API versionné et validé sur payloads invalides");
  }

  if (input.scope === "security") {
    base.push("Audit trail incluant owner, horodatage et note de transition");
  }

  return base;
}

function getStore(): GlobalStore {
  const globalThisRef = globalThis as typeof globalThis & {
    [STORE_KEY]?: GlobalStore;
  };

  if (!globalThisRef[STORE_KEY]) {
    globalThisRef[STORE_KEY] = {
      items: [
        {
          id: "cr_bootstrap_admin_workflow",
          title: "Bootstrap Admin change workflow",
          problem:
            "Les demandes d'évolution n'ont pas de point d'entrée unique côté admin.",
          desiredOutcome:
            "Un flux traçable avec statut, owners et release notes automatiques.",
          scope: "fullstack",
          priority: "P1",
          status: "triaged",
          requestedBy: "root",
          linkedRepo: "cross-repo",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          targetReleaseWindow: "next-48h",
          acceptanceCriteria: [
            "Un formulaire unique pour créer les demandes",
            "Transitions de statut strictes",
            "Section changelog corrélée",
          ],
          workflow: buildInitialStages().map((stage, idx) => ({
            ...stage,
            status: idx === 0 ? "done" : idx === 1 ? "active" : "pending",
            doneAt: idx === 0 ? nowIso() : undefined,
          })),
        },
      ],
    };
  }

  return globalThisRef[STORE_KEY]!;
}

function byUpdatedDesc(a: ChangeRequestItem, b: ChangeRequestItem): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function listChangeRequests(): ChangeRequestItem[] {
  return [...getStore().items].sort(byUpdatedDesc);
}

export function createChangeRequest(
  input: CreateChangeRequestInput
): ChangeRequestItem {
  const createdAt = nowIso();
  const item: ChangeRequestItem = {
    id: `cr_${Math.random().toString(36).slice(2, 10)}`,
    title: input.title.trim(),
    problem: input.problem.trim(),
    desiredOutcome: input.desiredOutcome.trim(),
    scope: input.scope,
    priority: computePriority(input),
    status: "submitted",
    requestedBy: input.requestedBy.trim() || "unknown",
    linkedRepo: input.linkedRepo,
    createdAt,
    updatedAt: createdAt,
    targetReleaseWindow:
      input.urgency === "high"
        ? "next-24h"
        : input.urgency === "medium"
          ? "next-72h"
          : "next-sprint",
    acceptanceCriteria: buildAcceptanceCriteria(input),
    workflow: buildInitialStages(),
  };

  getStore().items.push(item);
  return item;
}

function advanceWorkflowStages(stages: WorkflowStage[]): WorkflowStage[] {
  const currentIdx = stages.findIndex((stage) => stage.status === "active");
  if (currentIdx === -1) return stages;

  return stages.map((stage, idx) => {
    if (idx < currentIdx) return stage;
    if (idx === currentIdx)
      return { ...stage, status: "done", doneAt: nowIso() };
    if (idx === currentIdx + 1) return { ...stage, status: "active" };
    return stage;
  });
}

export function transitionChangeRequest(
  id: string,
  action: "advance" | "reject",
  note?: string
): ChangeRequestItem | null {
  const store = getStore();
  const idx = store.items.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const current = store.items[idx]!;
  if (current.status === "released" || current.status === "rejected")
    return current;

  if (action === "reject") {
    const rejected: ChangeRequestItem = {
      ...current,
      status: "rejected",
      updatedAt: nowIso(),
      acceptanceCriteria: note
        ? [...current.acceptanceCriteria, `Rejet motivé: ${note.trim()}`]
        : current.acceptanceCriteria,
    };
    store.items[idx] = rejected;
    return rejected;
  }

  const statusIdx = WORKFLOW_ORDER.indexOf(current.status);
  const nextStatus =
    WORKFLOW_ORDER[Math.min(statusIdx + 1, WORKFLOW_ORDER.length - 1)]!;

  const releasedEntry =
    nextStatus === "released"
      ? {
          title: current.title,
          summary: note?.trim() || current.desiredOutcome,
          releasedAt: nowIso(),
        }
      : undefined;

  const advanced: ChangeRequestItem = {
    ...current,
    status: nextStatus,
    updatedAt: nowIso(),
    workflow: advanceWorkflowStages(current.workflow),
    changelogEntry: releasedEntry ?? current.changelogEntry,
  };

  store.items[idx] = advanced;
  return advanced;
}

export function getWorkflowReleaseEntries() {
  return listChangeRequests()
    .filter((item) => item.status === "released" && item.changelogEntry)
    .map((item) => ({
      id: `rel_${item.id}`,
      title: item.changelogEntry!.title,
      summary: item.changelogEntry!.summary,
      releasedAt: item.changelogEntry!.releasedAt,
      sourceChangeRequestId: item.id,
      priority: item.priority,
      scope: item.scope,
    }));
}
