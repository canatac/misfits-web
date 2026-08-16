export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  status: "idle" | "running" | "done" | "failed";
  runId?: string;
};

export type OpsAction = {
  at: number;
  action: string;
  mode: "dry-run" | "execute";
};

export type Analytics = {
  sent: number;
  redactions: number;
  stops: number;
  regenerations: number;
  inserts: number;
  feedbackUp: number;
  feedbackDown: number;
  backendTaskRuns: number;
};

export interface TraceEvent {
  id: string;
  at: number;
  kind: string;
  message: string;
  level: "info" | "warn" | "error";
}
