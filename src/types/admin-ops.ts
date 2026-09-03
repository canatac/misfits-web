export type WorkflowStatus =
  | "submitted"
  | "triaged"
  | "planned"
  | "in_progress"
  | "qa"
  | "released"
  | "rejected";

export type WorkflowPriority = "P0" | "P1" | "P2";

export type ExecutionState =
  "idle" | "queued" | "running" | "failed" | "success";

export interface WorkflowStage {
  key: string;
  label: string;
  owner: "product" | "backend" | "frontend" | "qa" | "ops";
  status: "pending" | "active" | "done";
  checklist: string[];
  doneAt?: string;
}

export interface WorkflowEvent {
  at: string;
  actor: string;
  action: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  note?: string;
}

export interface ChangeRequestItem {
  id: string;
  title: string;
  problem: string;
  desiredOutcome: string;
  scope: "ux" | "backend" | "fullstack" | "security";
  priority: WorkflowPriority;
  status: WorkflowStatus;
  requestedBy: string;
  linkedRepo: "misfits-web" | "reimagined-guide" | "cross-repo";
  createdAt: string;
  updatedAt: string;
  takenInChargeAt?: string;
  takenInChargeBy?: string;
  targetReleaseWindow: string;
  acceptanceCriteria: string[];
  workflow: WorkflowStage[];
  workflowEvents: WorkflowEvent[];
  executionState?: ExecutionState;
  executionRunId?: string;
  executionStartedAt?: string;
  executionLastHeartbeatAt?: string;
  executionFinishedAt?: string;
  executionLastError?: string;
  changelogEntry?: {
    title: string;
    summary: string;
    releasedAt: string;
  };
}

export interface ChangeRequestsResponse {
  generatedAt: string;
  counts: Record<WorkflowStatus, number>;
  items: ChangeRequestItem[];
}

export interface CreateChangeRequestInput {
  title: string;
  problem: string;
  desiredOutcome: string;
  scope: ChangeRequestItem["scope"];
  urgency: "low" | "medium" | "high";
  impact: "small" | "medium" | "high";
  requestedBy: string;
  linkedRepo: ChangeRequestItem["linkedRepo"];
}

export interface TransitionChangeRequestInput {
  id: string;
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
    | "execution_reset";
  currentStatus?: WorkflowStatus;
  note?: string;
  actor?: string;
  executionRunId?: string;
  executionError?: string;
}

export interface StartImplementationChangeRequestInput {
  id: string;
  currentStatus: WorkflowStatus;
  note?: string;
  actor?: string;
}

export interface TransitionChangeRequestResponse {
  item: ChangeRequestItem;
}

export interface AdminChangelogRepoCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  committedAt: string;
  commitUrl: string;
  workflowUrl: string | null;
  workflowName: string | null;
}

export interface AdminChangelogRepository {
  key: "web" | "backend";
  owner: string;
  repo: string;
  latestShortSha: string;
  commits: AdminChangelogRepoCommit[];
}

export interface AdminWorkflowRelease {
  id: string;
  title: string;
  summary: string;
  releasedAt: string;
  sourceChangeRequestId: string;
  priority: WorkflowPriority;
  scope: ChangeRequestItem["scope"];
  sourceType?: "change_request" | "pull_request";
  repository?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  author?: string;
}

export interface AdminChangelogResponse {
  generatedAt: string;
  repositories: AdminChangelogRepository[];
  workflowReleases: AdminWorkflowRelease[];
  warnings?: string[];
}

export type AdminUserStatus = "active" | "restricted";

export interface AdminUserActivity {
  at: string;
  label: string;
  kind: "login" | "change_request" | "role_change" | "admin_action";
}

export interface AdminUserRecord {
  id: string;
  email: string;
  displayName?: string;
  role: "user" | "admin" | "support";
  status: AdminUserStatus;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  sessions24h: number;
  actions7d: number;
  changeRequests30d: number;
  recentActivity: AdminUserActivity[];
}

export interface AdminUsersResponse {
  generatedAt: string;
  users: AdminUserRecord[];
}

export interface CreateAdminUserInput {
  id?: string;
  email: string;
  displayName?: string;
  role: AdminUserRecord["role"];
  status?: AdminUserStatus;
  twoFactorEnabled?: boolean;
}

export interface UpdateAdminUserInput {
  id: string;
  role?: AdminUserRecord["role"];
  status?: AdminUserStatus;
}

export interface DeleteAdminUserInput {
  id: string;
}

export interface AdminAiRunItem {
  id: string;
  status: string;
  model: string;
  feature?: string;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
  pricingApplied?: string;
  sessionId?: string;
  userId?: string;
  error?: string;
}

export interface AdminAiActivityMetrics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  avgTokensPerRun: number;
  currency?: string;
  totalCostUsd?: number;
  avgCostPerRunUsd?: number;
  pricedRuns?: number;
  unpricedRuns?: number;
}

export interface AdminAiActivityByUser {
  userId: string;
  runs: number;
  completedRuns: number;
  failedRuns: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  avgTokensPerRun: number;
  avgCostPerRunUsd: number;
  successRate: number;
}

export interface AdminAiActivityByModel {
  model: string;
  runs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  avgTokensPerRun: number;
}

export interface AdminAiActivityByFeature {
  feature: string;
  runs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  avgTokensPerRun: number;
}

export interface AdminAiActivityTrendPoint {
  day: string;
  runs: number;
  completedRuns: number;
  failedRuns: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  successRate: number;
}

export interface AdminAiActivityTrendByUser {
  userId: string;
  days: AdminAiActivityTrendPoint[];
}

export interface AdminAiActivityPricing {
  source: string;
  provider: string;
  openRouterRatesCount: number;
  envModelOverridesCount: number;
  defaultInputPer1MUsd: number;
  defaultOutputPer1MUsd: number;
}

export interface AdminAiActivityResponse {
  generatedAt: string;
  limit: number;
  metrics: AdminAiActivityMetrics;
  runs: AdminAiRunItem[];
  byUser?: AdminAiActivityByUser[];
  byModel?: AdminAiActivityByModel[];
  byFeature?: AdminAiActivityByFeature[];
  trends?: {
    global: AdminAiActivityTrendPoint[];
    byUser: AdminAiActivityTrendByUser[];
  };
  pricing?: AdminAiActivityPricing;
  warnings?: string[];
}

// ─── Deliverability + Whoami (extracted) ──────────────────────────────────────
export type {
  DeliverabilityProcedureItem,
  DeliverabilityCtaDetail,
  DeliverabilityProcedureResponse,
  AdminDeliverabilityDiagnosticsResponse,
  AdminWhoamiResponse,
} from "./admin-ops-deliverability";
