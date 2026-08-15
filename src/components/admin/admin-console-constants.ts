// admin-console-constants.ts — Extraction des constantes et types
// de admin-console-page.tsx (refactor itération architecte, nov 2026).
//
// Objectif clean code: sortir les tables de mapping et énumérations
// hors du composant React monolithique pour améliorer la maintenabilité
// et permettre leur réutilisation par les sous-composants de tab.

import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import type { WorkflowStatus } from "@/types/admin-ops";

// Onglets disponibles dans la console admin.
export type AdminTab =
  | "overview"
  | "monitoring"
  | "security"
  | "deliverability-ops"
  | "changelog"
  | "change-requests"
  | "users";

// Fenêtres temporelles proposées dans les filtres monitoring.
export const WINDOW_OPTIONS: MonitoringWindow[] = [
  "15m",
  "1h",
  "6h",
  "24h",
  "7d",
];

// Sévérités disponibles dans le filtre sécurité (avec option "all").
export const SEVERITY_OPTIONS: Array<SecuritySeverity | "all"> = [
  "all",
  "info",
  "low",
  "medium",
  "high",
  "critical",
];

// Colonnes du kanban de change-requests dans l'ordre du flux.
export const WORKFLOW_STATUS_COLUMNS: WorkflowStatus[] = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
  "rejected",
];

// Labels FR des statuts (affichage kanban et badges).
export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  submitted: "Soumise",
  triaged: "Triage",
  planned: "Planifiée",
  in_progress: "En cours",
  qa: "QA",
  released: "Released",
  rejected: "Rejetée",
};
