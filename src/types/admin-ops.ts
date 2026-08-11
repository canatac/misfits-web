export type WorkflowStatus =
  | "submitted"
  | "triaged"
  | "planned"
  | "in_progress"
  | "qa"
  | "released"
  | "rejected";

export type WorkflowPriority = "P0" | "P1" | "P2";

export interface WorkflowStage {
  key: string;
  label: string;
  owner: "product" | "backend" | "frontend" | "qa" | "ops";
  status: "pending" | "active" | "done";
  checklist: string[];
  doneAt?: string;
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
  targetReleaseWindow: string;
  acceptanceCriteria: string[];
  workflow: WorkflowStage[];
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
  action: "advance" | "reject";
  note?: string;
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
}

export interface AdminChangelogResponse {
  generatedAt: string;
  repositories: AdminChangelogRepository[];
  workflowReleases: AdminWorkflowRelease[];
}
