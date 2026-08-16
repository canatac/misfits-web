import type { Email, EmailAttachment } from "@/types/email";

export type GroupingRule = "folder" | "sender" | "month" | "type";
export type ScopeRule = "all" | "received" | "sent";

export type WorkspaceLeaf = {
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

export type WorkspaceNode = {
  id: string;
  name: string;
  children: WorkspaceNode[];
  files: WorkspaceLeaf[];
};

export type WorkflowRule = {
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

export const RULES_STORAGE_KEY = "misfits-files-workspace-rules-v1";

export const SAFE_EXTENSIONS = new Set([
  "pdf", "txt", "csv", "doc", "docx", "xls", "xlsx",
  "png", "jpg", "jpeg", "gif", "webp",
]);

export function makeRule(partial?: Partial<WorkflowRule>): WorkflowRule {
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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function monthKey(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "unknown-month";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ownerFor(email: Email): string {
  const from = email.from?.address || "unknown";
  const to0 = email.to?.[0]?.address || "unknown";
  return email.folder === "sent" ? to0 : from;
}

export function fileTypeKey(att: EmailAttachment): string {
  if (att.type && att.type !== "other") return att.type;
  const ext = att.filename.split(".").pop()?.toLowerCase();
  return ext ? `ext-${ext}` : "other";
}

export function addPath(root: WorkspaceNode, parts: string[], file: WorkspaceLeaf): void {
  let cursor = root;
  parts.forEach((part, idx) => {
    const key = part.trim() || "(unknown)";
    let child = cursor.children.find((c) => c.name === key);
    if (!child) {
      child = { id: `${cursor.id}/${key}-${idx}`, name: key, children: [], files: [] };
      cursor.children.push(child);
    }
    cursor = child;
  });
  cursor.files.push(file);
}

export function collectFiles(emails: Email[], scope: ScopeRule): WorkspaceLeaf[] {
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

export function buildTree(emails: Email[], grouping: GroupingRule, scope: ScopeRule): WorkspaceNode {
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

export function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();
}

export function extOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isSafeByRule(file: WorkspaceLeaf, rule: WorkflowRule): boolean {
  if (!rule.safeOnly) return true;
  if (file.size > Math.max(1, rule.maxSizeMb) * 1024 * 1024) return false;
  const ext = extOf(file.name);
  if (!ext || !SAFE_EXTENSIONS.has(ext)) return false;
  return true;
}

export function matchesRule(file: WorkspaceLeaf, rule: WorkflowRule): boolean {
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
