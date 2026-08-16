"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { mailAuthHeaders } from "@/lib/mail-api";
import type { Email } from "@/types/email";
import {
  buildTree,
  collectFiles,
  makeRule,
  matchesRule,
  RULES_STORAGE_KEY,
  sanitizeSegment,
  type GroupingRule,
  type ScopeRule,
  type WorkflowRule,
  type WorkspaceLeaf,
} from "@/lib/file-workspace";

type DirectoryHandleLike = {
  getDirectoryHandle: (name: string, opts?: { create?: boolean }) => Promise<DirectoryHandleLike>;
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<FileHandleLike>;
};

type FileHandleLike = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
};

async function fetchFolder(folder: string): Promise<Email[]> {
  const params = new URLSearchParams({ folder, page: "1", pageSize: "200" });
  const res = await fetch(`/api/emails?${params.toString()}`, {
    headers: mailAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load ${folder}: ${res.status}`);
  const data = (await res.json()) as { emails?: Email[] };
  return Array.isArray(data.emails) ? data.emails : [];
}

async function ensureNestedDir(root: DirectoryHandleLike, destination: string): Promise<DirectoryHandleLike> {
  const parts = destination.split("/").map(sanitizeSegment).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

async function writeBlobToDir(dir: DirectoryHandleLike, fileName: string, blob: Blob): Promise<void> {
  const safeName = sanitizeSegment(fileName) || "document";
  const handle = await dir.getFileHandle(safeName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/* -------------------------------------------------------------------------- */
/*  Reducer — consolidates all workspace state (data + view + workflow).      */
/* -------------------------------------------------------------------------- */

interface WorkspaceState {
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

type WorkspaceAction =
  | { type: "loadStart" }
  | { type: "loadSuccess"; emails: Email[] }
  | { type: "loadError"; error: string }
  | { type: "setGrouping"; grouping: GroupingRule }
  | { type: "setScope"; scope: ScopeRule }
  | { type: "toggleExpanded"; id: string }
  | { type: "setRules"; rules: WorkflowRule[] }
  | { type: "setWorkflowStatus"; status: string }
  | { type: "setRunningWorkflow"; running: boolean };

const initialState: WorkspaceState = {
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

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
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

export function useFileWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const {
    loading,
    error,
    emails,
    grouping,
    scope,
    expanded,
    rules,
    workflowStatus,
    runningWorkflow,
  } = state;

  const load = useCallback(async () => {
    dispatch({ type: "loadStart" });
    try {
      const [inbox, sent] = await Promise.all([fetchFolder("inbox"), fetchFolder("sent")]);
      const byId = new Map<string, Email>();
      [...inbox, ...sent].forEach((e) => byId.set(e.id, e));
      dispatch({ type: "loadSuccess", emails: Array.from(byId.values()) });
    } catch (e) {
      dispatch({ type: "loadError", error: (e as Error).message || "Failed to load workspace files" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RULES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WorkflowRule[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        dispatch({ type: "setRules", rules: parsed.map((r) => makeRule(r)) });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const tree = useMemo(() => buildTree(emails, grouping, scope), [emails, grouping, scope]);
  const files = useMemo(() => collectFiles(emails, scope), [emails, scope]);

  const setGrouping = useCallback(
    (g: GroupingRule) => dispatch({ type: "setGrouping", grouping: g }),
    []
  );
  const setScope = useCallback(
    (s: ScopeRule) => dispatch({ type: "setScope", scope: s }),
    []
  );
  const toggleExpanded = useCallback(
    (id: string) => dispatch({ type: "toggleExpanded", id }),
    []
  );
  const setRules = useCallback(
    (updater: WorkflowRule[] | ((prev: WorkflowRule[]) => WorkflowRule[])) => {
      dispatch({
        type: "setRules",
        rules: typeof updater === "function" ? updater(rules) : updater,
      });
    },
    [rules]
  );

  const runWorkflow = useCallback(async () => {
    const win = window as WindowWithDirectoryPicker;
    const activeRules = rules.filter((r) => r.enabled);

    if (activeRules.length === 0) {
      dispatch({ type: "setWorkflowStatus", status: "Active au moins une règle de workflow." });
      return;
    }

    const fetchAttachmentBlob = async (file: WorkspaceLeaf): Promise<Blob | null> => {
      if (!file.downloadUrl) return null;
      const res = await fetch(file.downloadUrl, {
        headers: mailAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.blob();
    };

    const triggerBrowserDownload = (blob: Blob, suggestedName: string) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = suggestedName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    };

    dispatch({ type: "setRunningWorkflow", running: true });

    try {
      let saved = 0;
      let skipped = 0;

      if (!win.showDirectoryPicker) {
        dispatch({
          type: "setWorkflowStatus",
          status:
            "Mode compatibilité: Firefox privé détecté, téléchargement local sans choix de dossier (noms préfixés par destination).",
        });

        for (const file of files) {
          const rule = activeRules.find((r) => matchesRule(file, r));
          if (!rule) {
            skipped += 1;
            continue;
          }

          const blob = await fetchAttachmentBlob(file);
          if (!blob) {
            skipped += 1;
            continue;
          }

          const destinationPrefix = rule.destination
            .split("/")
            .map(sanitizeSegment)
            .filter(Boolean)
            .join("__");
          const safeName = sanitizeSegment(file.name) || "document";
          const suggestedName = destinationPrefix ? `${destinationPrefix}__${safeName}` : safeName;

          triggerBrowserDownload(blob, suggestedName);
          saved += 1;
        }

        dispatch({
          type: "setWorkflowStatus",
          status: `Workflow compat terminé: ${saved} téléchargement(s) lancés, ${skipped} ignoré(s).`,
        });
        return;
      }

      dispatch({ type: "setWorkflowStatus", status: "Demande d’autorisation dossier en cours..." });
      const root = await win.showDirectoryPicker();

      for (const file of files) {
        const rule = activeRules.find((r) => matchesRule(file, r));
        if (!rule) {
          skipped += 1;
          continue;
        }

        const blob = await fetchAttachmentBlob(file);
        if (!blob) {
          skipped += 1;
          continue;
        }

        const targetDir = await ensureNestedDir(root, rule.destination);
        await writeBlobToDir(targetDir, file.name, blob);
        saved += 1;
      }

      dispatch({
        type: "setWorkflowStatus",
        status: `Workflow terminé: ${saved} fichier(s) enregistrés, ${skipped} ignoré(s).`,
      });
    } catch (e) {
      const message = (e as Error).message || "workflow failed";
      dispatch({ type: "setWorkflowStatus", status: `Workflow interrompu: ${message}` });
    } finally {
      dispatch({ type: "setRunningWorkflow", running: false });
    }
  }, [files, rules]);

  return {
    loading,
    error,
    emails,
    grouping,
    setGrouping,
    scope,
    setScope,
    expanded,
    toggleExpanded,
    rules,
    setRules,
    workflowStatus,
    runningWorkflow,
    load,
    tree,
    fileCount: files.length,
    runWorkflow,
  };
}
