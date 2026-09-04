/**
 * State, reducer and filesystem helpers for `use-file-workspace`.
 * No import from use-file-workspace.ts.
 */
import { mailAuthHeaders } from "@/lib/mail-api";
import { normalizeEmailRecord } from "@/lib/email-normalization";
import type { Email } from "@/types/email";
import {
  makeRule,
  sanitizeSegment,
  type GroupingRule,
  type ScopeRule,
  type WorkflowRule,
} from "@/lib/file-workspace";

export type DirectoryHandleLike = {
  getDirectoryHandle: (
    name: string,
    opts?: { create?: boolean }
  ) => Promise<DirectoryHandleLike>;
  getFileHandle: (
    name: string,
    opts?: { create?: boolean }
  ) => Promise<FileHandleLike>;
};

export type FileHandleLike = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

export type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
};

export async function fetchFolder(folder: string): Promise<Email[]> {
  const params = new URLSearchParams({ folder, page: "1", pageSize: "200" });
  const res = await fetch(`/api/emails?${params.toString()}`, {
    headers: mailAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load ${folder}: ${res.status}`);
  const data = (await res.json()) as { emails?: Email[] };
  return Array.isArray(data.emails)
    ? data.emails.map((email) => normalizeEmailRecord(email))
    : [];
}

export async function ensureNestedDir(
  root: DirectoryHandleLike,
  destination: string
): Promise<DirectoryHandleLike> {
  const parts = destination.split("/").map(sanitizeSegment).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

export async function writeBlobToDir(
  dir: DirectoryHandleLike,
  fileName: string,
  blob: Blob
): Promise<void> {
  const safeName = sanitizeSegment(fileName) || "document";
  const handle = await dir.getFileHandle(safeName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export interface WorkspaceState {
  loading: boolean;
  error: string | null;
  emails: Email[];
  grouping: GroupingRule;
  scope: ScopeRule;
  expanded: Set<string>;
  rules: WorkflowRule[];
  workflowStatus: string;
  runningWorkflow: boolean;
}

export type WorkspaceAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; emails: Email[] }
  | { type: "loadError"; error: string }
  | { type: "setGrouping"; grouping: GroupingRule }
  | { type: "setScope"; scope: ScopeRule }
  | { type: "toggleExpanded"; id: string }
  | { type: "setRules"; rules: WorkflowRule[] }
  | { type: "setWorkflowStatus"; status: string }
  | { type: "setRunningWorkflow"; running: boolean };

export const initialWorkspaceState: WorkspaceState = {
  loading: false,
  error: null,
  emails: [],
  grouping: "folder",
  scope: "all",
  expanded: new Set(["root"]),
  rules: [makeRule()],
  workflowStatus: "",
  runningWorkflow: false,
};

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case "loadStart":
      return { ...state, loading: true, error: null };
    case "loadSuccess":
      return { ...state, loading: false, emails: action.emails };
    case "loadError":
      return { ...state, loading: false, error: action.error };
    case "setGrouping":
      return { ...state, grouping: action.grouping };
    case "setScope":
      return { ...state, scope: action.scope };
    case "toggleExpanded": {
      const next = new Set(state.expanded);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, expanded: next };
    }
    case "setRules":
      return { ...state, rules: action.rules };
    case "setWorkflowStatus":
      return { ...state, workflowStatus: action.status };
    case "setRunningWorkflow":
      return { ...state, runningWorkflow: action.running };
    default:
      return state;
  }
}
