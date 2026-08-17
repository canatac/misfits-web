// Extracted from admin-ops.ts (cycle 62 LOC≤250 refactor).

export interface DeliverabilityProcedureItem {
  id: string;
  label: string;
  title?: string;
  status: "done" | "pending" | "na" | "done_manual" | "blocked";
  note?: string;
  cta?: string | { label: string; details?: string };
  evidence?: string;
  operator_note?: string;
}

export interface DeliverabilityCtaDetail {
  label: string;
  description: string;
}

export interface DeliverabilityProcedureResponse {
  overall_status?: string;
  domain?: string;
  window?: string;
  progress?: { done?: number; total?: number };
  reminder?: { enabled?: boolean; cadence_hours?: number; next_due_at?: string };
  automation?: { auto_checks?: string[]; last_computed_at?: string };
  checklist?: DeliverabilityProcedureItem[];
  cta_details?: DeliverabilityCtaDetail[];
}

export interface AdminDeliverabilityDiagnosticsResponse {
  window: string;
  spf?: { valid: boolean; record?: string };
  dkim?: { valid: boolean; domains?: string[] };
  dmarc?: { valid: boolean; record?: string };
  mx?: { records?: string[] };
  bounces?: { total: number; rate: number };
  [key: string]: unknown;
}

export interface AdminWhoamiResponse {
  email: string;
  role: string;
  display_name?: string;
}
