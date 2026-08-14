"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, FileText, RefreshCw, ChevronRight, ChevronDown, Download } from "lucide-react";
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

function buildTree(emails: Email[], grouping: GroupingRule, scope: ScopeRule): WorkspaceNode {
  const root: WorkspaceNode = {
    id: "root",
    name: "/local-mail-workspace",
    children: [],
    files: [],
  };

  for (const email of emails) {
    if (scope === "received" && email.folder === "sent") continue;
    if (scope === "sent" && email.folder !== "sent") continue;

    for (const att of email.attachments ?? []) {
      const owner = ownerFor(email);
      const file: WorkspaceLeaf = {
        id: `${email.id}:${att.id}`,
        name: att.filename,
        downloadUrl: att.downloadUrl,
        contentType: att.contentType,
        size: att.size,
        subject: email.subject,
        owner,
        folder: email.folder,
        date: email.date,
      };

      const parts =
        grouping === "folder"
          ? [email.folder, monthKey(email.date), owner]
          : grouping === "sender"
            ? [owner, email.folder, monthKey(email.date)]
            : grouping === "month"
              ? [monthKey(email.date), email.folder, owner]
              : [fileTypeKey(att), email.folder, monthKey(email.date), owner];

      addPath(root, parts, file);
    }
  }

  const sortNode = (node: WorkspaceNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortNode);
  };
  sortNode(root);

  return root;
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
                <div className="truncate">{file.subject} · {formatBytes(file.size)}</div>
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

  const tree = useMemo(() => buildTree(emails, grouping, scope), [emails, grouping, scope]);
  const fileCount = useMemo(
    () => emails.reduce((acc, e) => acc + (e.attachments?.length ?? 0), 0),
    [emails]
  );

  return (
    <NovamailWorkspaceShell>
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">Files Workspace</h1>
            <p className="text-sm text-[#A1A1AA]">
              Explorateur local des documents mail (reçus + envoyés), classés par règle.
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
