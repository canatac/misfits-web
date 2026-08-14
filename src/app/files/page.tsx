"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";
import { mailAuthHeaders } from "@/lib/mail-api";
import type { Email, EmailAttachment } from "@/types/email";

type GroupingRule = "folder" | "sender" | "month" | "type";
type ScopeRule = "all" | "received" | "sent";

type WorkspaceLeaf = {
  id: string;
  name: string;
  downloadUrl?: string;
  contentType: string;
  size: number;
  subject: string;
  owner: string;
  folder: string;
  date: string;
};

type WorkspaceNode = {
  id: string;
  name: string;
  children: WorkspaceNode[];
  files: WorkspaceLeaf[];
};

type WorkflowRule = {
  id: string;
  name: string;
  enabled: boolean;
  scope: ScopeRule;
  senderContains: string;
  filenameIncludes: string;
  extensionsCsv: string;
  destination: string;
  safeOnly: boolean;
  maxSizeMb: number;
};

type DirectoryHandleLike = {
  getDirectoryHandle: (
    name: string,
    opts?: { create?: boolean }
  ) => Promise<DirectoryHandleLike>;
  getFileHandle: (
    name: string,
    opts?: { create?: boolean }
  ) => Promise<FileHandleLike>;
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

const RULES_STORAGE_KEY = "misfits-files-workspace-rules-v1";
const SAFE_EXTENSIONS = new Set([
  "pdf",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
]);

function makeRule(partial?: Partial<WorkflowRule>): WorkflowRule {
  return {
    id: `rule-${Math.random().toString(36).slice(2, 9)}`,
    name: partial?.name || "Nouveau workflow",
    enabled: partial?.enabled ?? true,
    scope: partial?.scope || "all",
    senderContains: partial?.senderContains || "",
    filenameIncludes: partial?.filenameIncludes || "",
    extensionsCsv: partial?.extensionsCsv || "pdf,doc,docx,xls,xlsx,csv,txt",
    destination: partial?.destination || "documents/tri",
    safeOnly: partial?.safeOnly ?? true,
    maxSizeMb: partial?.maxSizeMb ?? 10,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function monthKey(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "unknown-month";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function ownerFor(email: Email): string {
  const from = email.from?.address || "unknown";
  const to0 = email.to?.[0]?.address || "unknown";
  return email.folder === "sent" ? to0 : from;
}

function fileTypeKey(att: EmailAttachment): string {
  if (att.type && att.type !== "other") return att.type;
  const ext = att.filename.split(".").pop()?.toLowerCase();
  return ext ? `ext-${ext}` : "other";
}

function addPath(root: WorkspaceNode, parts: string[], file: WorkspaceLeaf): void {
  let cursor = root;
  parts.forEach((part, idx) => {
    const key = part.trim() || "(unknown)";
    let child = cursor.children.find((c) => c.name === key);
    if (!child) {
      child = {
        id: `${cursor.id}/${key}-${idx}`,
        name: key,
        children: [],
        files: [],
      };
      cursor.children.push(child);
    }
    cursor = child;
  });
  cursor.files.push(file);
}

function collectFiles(emails: Email[], scope: ScopeRule): WorkspaceLeaf[] {
  const out: WorkspaceLeaf[] = [];
  for (const email of emails) {
    if (scope === "received" && email.folder === "sent") continue;
    if (scope === "sent" && email.folder !== "sent") continue;
    for (const att of email.attachments ?? []) {
      out.push({
        id: `${email.id}:${att.id}`,
        name: att.filename,
        downloadUrl: att.downloadUrl,
        contentType: att.contentType,
        size: att.size,
        subject: email.subject,
        owner: ownerFor(email),
        folder: email.folder,
        date: email.date,
      });
    }
  }
  return out;
}

function buildTree(emails: Email[], grouping: GroupingRule, scope: ScopeRule): WorkspaceNode {
  const root: WorkspaceNode = {
    id: "root",
    name: "/local-mail-workspace",
    children: [],
    files: [],
  };

  for (const file of collectFiles(emails, scope)) {
    const parts =
      grouping === "folder"
        ? [file.folder, monthKey(file.date), file.owner]
        : grouping === "sender"
          ? [file.owner, file.folder, monthKey(file.date)]
          : grouping === "month"
            ? [monthKey(file.date), file.folder, file.owner]
            : [fileTypeKey({ filename: file.name, type: "other" } as EmailAttachment), file.folder, monthKey(file.date), file.owner];

    addPath(root, parts, file);
  }

  const sortNode = (node: WorkspaceNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root;
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();
}

function extOf(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

function isSafeByRule(file: WorkspaceLeaf, rule: WorkflowRule): boolean {
  if (!rule.safeOnly) return true;
  if (file.size > Math.max(1, rule.maxSizeMb) * 1024 * 1024) return false;
  const ext = extOf(file.name);
  if (!ext || !SAFE_EXTENSIONS.has(ext)) return false;
  return true;
}

function matchesRule(file: WorkspaceLeaf, rule: WorkflowRule): boolean {
  if (!rule.enabled) return false;
  if (rule.scope === "received" && file.folder === "sent") return false;
  if (rule.scope === "sent" && file.folder !== "sent") return false;

  const senderNeedle = rule.senderContains.trim().toLowerCase();
  if (senderNeedle && !file.owner.toLowerCase().includes(senderNeedle)) return false;

  const nameNeedle = rule.filenameIncludes.trim().toLowerCase();
  if (nameNeedle && !file.name.toLowerCase().includes(nameNeedle)) return false;

  const allowedExt = rule.extensionsCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowedExt.length > 0) {
    const ext = extOf(file.name);
    if (!allowedExt.includes(ext)) return false;
  }

  return isSafeByRule(file, rule);
}

async function fetchFolder(folder: string): Promise<Email[]> {
  const params = new URLSearchParams({ folder, page: "1", pageSize: "200" });
  const res = await fetch(`/api/emails?${params.toString()}`, {
    headers: mailAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${folder}: ${res.status}`);
  }
  const data = (await res.json()) as { emails?: Email[] };
  return Array.isArray(data.emails) ? data.emails : [];
}

async function ensureNestedDir(root: DirectoryHandleLike, destination: string): Promise<DirectoryHandleLike> {
  const parts = destination
    .split("/")
    .map((p) => sanitizeSegment(p))
    .filter(Boolean);

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

function TreeNodeView({
  node,
  expanded,
  onToggle,
}: {
  node: WorkspaceNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isOpen = expanded.has(node.id);
  return (
    <div className="pl-3">
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        className="flex w-full items-center gap-1 rounded px-1 py-1 text-left text-sm text-[#D4D4D8] hover:bg-[#1A1A1D]"
      >
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <FolderOpen className="h-3.5 w-3.5 text-[#C49B66]" />
        <span>{node.name}</span>
      </button>

      {isOpen && (
        <div className="ml-4 border-l border-[#242427]">
          {node.children.map((child) => (
            <TreeNodeView key={child.id} node={child} expanded={expanded} onToggle={onToggle} />
          ))}
          {node.files.map((file) => (
            <div
              key={file.id}
              className="ml-2 flex items-center justify-between gap-2 rounded px-2 py-1 text-xs text-[#A1A1AA] hover:bg-[#1A1A1D]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[#E4E4E7]">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="truncate">
                  {file.subject} · {formatBytes(file.size)} · {file.owner}
                </div>
              </div>
              {file.downloadUrl ? (
                <a
                  href={file.downloadUrl}
                  className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-[11px] text-[#C49B66] hover:bg-[#242427]"
                >
                  <Download className="h-3 w-3" />
                  Ouvrir
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [grouping, setGrouping] = useState<GroupingRule>("folder");
  const [scope, setScope] = useState<ScopeRule>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root"]));
  const [rules, setRules] = useState<WorkflowRule[]>([makeRule()]);
  const [workflowStatus, setWorkflowStatus] = useState<string>("");
  const [runningWorkflow, setRunningWorkflow] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inbox, sent] = await Promise.all([fetchFolder("inbox"), fetchFolder("sent")]);
      const byId = new Map<string, Email>();
      [...inbox, ...sent].forEach((e) => byId.set(e.id, e));
      setEmails(Array.from(byId.values()));
    } catch (e) {
      setError((e as Error).message || "Failed to load workspace files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RULES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WorkflowRule[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRules(parsed.map((r) => makeRule(r)));
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
  const fileCount = files.length;

  const runWorkflow = async () => {
    const win = window as WindowWithDirectoryPicker;
    const activeRules = rules.filter((r) => r.enabled);

    if (activeRules.length === 0) {
      setWorkflowStatus("Active au moins une règle de workflow.");
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

    setRunningWorkflow(true);

    try {
      let saved = 0;
      let skipped = 0;

      if (!win.showDirectoryPicker) {
        setWorkflowStatus(
          "Mode compatibilité: Firefox privé détecté, téléchargement local sans choix de dossier (noms préfixés par destination)."
        );

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
            .map((p) => sanitizeSegment(p))
            .filter(Boolean)
            .join("__");
          const safeName = sanitizeSegment(file.name) || "document";
          const suggestedName = destinationPrefix ? `${destinationPrefix}__${safeName}` : safeName;

          triggerBrowserDownload(blob, suggestedName);
          saved += 1;
        }

        setWorkflowStatus(
          `Workflow compat terminé: ${saved} téléchargement(s) lancés, ${skipped} ignoré(s).`
        );
        return;
      }

      setWorkflowStatus("Demande d’autorisation dossier en cours...");
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

      setWorkflowStatus(`Workflow terminé: ${saved} fichier(s) enregistrés, ${skipped} ignoré(s).`);
    } catch (e) {
      const message = (e as Error).message || "workflow failed";
      setWorkflowStatus(`Workflow interrompu: ${message}`);
    } finally {
      setRunningWorkflow(false);
    }
  };

  return (
    <NovamailWorkspaceShell>
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">Files Workspace</h1>
            <p className="text-sm text-[#A1A1AA]">
              Explorateur local + workflows de sauvegarde sur la machine du navigateur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2D] bg-[#0E0E10] px-3 py-2 text-sm text-[#D4D4D8] hover:bg-[#1A1A1D] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
        </div>

        <div className="mb-4 grid gap-3 rounded-xl border border-[#242427] bg-[#0E0E10] p-3 md:grid-cols-3">
          <label className="text-sm text-[#D4D4D8]">
            Règle de classement
            <select
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as GroupingRule)}
              className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-sm"
            >
              <option value="folder">Par dossier mail</option>
              <option value="sender">Par correspondant</option>
              <option value="month">Par mois</option>
              <option value="type">Par type de document</option>
            </select>
          </label>

          <label className="text-sm text-[#D4D4D8]">
            Critère de périmètre
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ScopeRule)}
              className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-sm"
            >
              <option value="all">Tous (reçus + envoyés)</option>
              <option value="received">Reçus uniquement</option>
              <option value="sent">Envoyés uniquement</option>
            </select>
          </label>

          <div className="rounded border border-[#242427] bg-[#141417] px-3 py-2 text-sm text-[#A1A1AA]">
            <div>Mails indexés: {emails.length}</div>
            <div>Documents trouvés: {fileCount}</div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[#242427] bg-[#0E0E10] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Workflow local (côté navigateur)</h2>
              <p className="text-xs text-[#A1A1AA]">
                Les règles ci-dessous décident quels fichiers sont enregistrés et dans quel sous-dossier local.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRules((prev) => [...prev, makeRule({ name: `Workflow ${prev.length + 1}` })])}
              className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-xs text-[#D4D4D8] hover:bg-[#1A1A1D]"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter règle
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-[#242427] bg-[#121214] p-3">
                <div className="mb-2 grid gap-2 md:grid-cols-5">
                  <label className="text-xs text-[#A1A1AA]">
                    Nom
                    <input
                      value={rule.name}
                      onChange={(e) =>
                        setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, name: e.target.value } : r)))
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>

                  <label className="text-xs text-[#A1A1AA]">
                    Scope
                    <select
                      value={rule.scope}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, scope: e.target.value as ScopeRule } : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs"
                    >
                      <option value="all">all</option>
                      <option value="received">received</option>
                      <option value="sent">sent</option>
                    </select>
                  </label>

                  <label className="text-xs text-[#A1A1AA]">
                    Sender contains
                    <input
                      value={rule.senderContains}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, senderContains: e.target.value } : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>

                  <label className="text-xs text-[#A1A1AA]">
                    Filename contains
                    <input
                      value={rule.filenameIncludes}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, filenameIncludes: e.target.value } : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>

                  <label className="text-xs text-[#A1A1AA]">
                    Extensions (csv)
                    <input
                      value={rule.extensionsCsv}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, extensionsCsv: e.target.value } : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <label className="text-xs text-[#A1A1AA] md:col-span-2">
                    Destination locale (ex: documents/factures/2026)
                    <input
                      value={rule.destination}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id ? { ...r, destination: e.target.value } : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>

                  <label className="text-xs text-[#A1A1AA]">
                    Taille max (MB)
                    <input
                      type="number"
                      min={1}
                      value={rule.maxSizeMb}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id
                              ? { ...r, maxSizeMb: Number(e.target.value || 1) }
                              : r
                          )
                        )
                      }
                      className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                    />
                  </label>

                  <div className="flex items-end justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8]">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((r) =>
                              r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                            )
                          )
                        }
                      />
                      Active
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8]">
                      <input
                        type="checkbox"
                        checked={rule.safeOnly}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((r) =>
                              r.id === rule.id ? { ...r, safeOnly: e.target.checked } : r
                            )
                          )
                        }
                      />
                      Doc sûr
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setRules((prev) =>
                          prev.length <= 1 ? prev : prev.filter((r) => r.id !== rule.id)
                        )
                      }
                      className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-xs text-[#FCA5A5] hover:bg-[#1A1A1D]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => void runWorkflow()}
              disabled={runningWorkflow}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2D] bg-[#141417] px-3 py-2 text-sm text-[#E4E4E7] hover:bg-[#1A1A1D] disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Exécuter workflow local
            </button>
            <span className="text-xs text-[#A1A1AA]">
              {workflowStatus || "Choisis un dossier local quand le navigateur te le demande."}
            </span>
          </div>
        </div>

        {error ? <div className="mb-3 text-sm text-red-400">{error}</div> : null}

        <div className="max-h-[70vh] overflow-auto rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <TreeNodeView
            node={tree}
            expanded={expanded}
            onToggle={(id) => {
              setExpanded((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
          />
        </div>
      </div>
    </NovamailWorkspaceShell>
  );
}
