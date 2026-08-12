/**
 * Email signature management.
 *
 * Generates a default signature from a user's display name, stores/retrieves
 * custom signatures in localStorage, and provides a few HTML signature
 * templates.
 */

import type { EmailSignature } from "@/types/composer";

const STORAGE_KEY = "misfits:signatures";
const ACTIVE_KEY = "misfits:active-signature";

/** A ready-to-insert HTML signature template. */
export interface SignatureTemplate {
  id: string;
  name: string;
  html: string;
}

export const signatureTemplates: SignatureTemplate[] = [
  {
    id: "sig-default",
    name: "Simple",
    html: `<div style="font-family:system-ui,sans-serif;font-size:14px;color:inherit;margin-top:16px"><br/>--&nbsp;<br/><strong>{{name}}</strong><br/>{{title}}<br/><a href="mailto:{{email}}" style="color:inherit">{{email}}</a></div>`,
  },
  {
    id: "sig-brand",
    name: "Branded",
    html: `<div style="font-family:system-ui,sans-serif;font-size:14px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px"><strong style="color:#6366f1">{{name}}</strong><br/><span style="color:#6b7280">{{title}} · misfits.ai</span><br/><a href="mailto:{{email}}" style="color:#6366f1;text-decoration:none">{{email}}</a><br/><a href="https://misfits.ai" style="color:#6366f1;text-decoration:none">misfits.ai</a></div>`,
  },
  {
    id: "sig-minimal",
    name: "Minimal",
    html: `<div style="font-family:system-ui,sans-serif;font-size:13px;color:#6b7280;margin-top:16px"><br/>{{name}} · {{email}}</div>`,
  },
];

/** Generate the default signature from a user's name and email. */
export function generateDefaultSignature(
  name: string,
  email: string,
  title = ""
): EmailSignature {
  const display = name || email.split("@")[0] || "me";
  const tmpl = signatureTemplates[0];
  const html = tmpl.html
    .replace(/{{name}}/g, display)
    .replace(/{{title}}/g, title)
    .replace(/{{email}}/g, email);
  return {
    id: "sig-default",
    name: "Default",
    html,
    isDefault: true,
  };
}

/** Read all stored signatures from localStorage. */
export function getSignatures(): EmailSignature[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmailSignature[];
  } catch {
    return [];
  }
}

/** Persist the full signature list to localStorage. */
export function saveSignatures(signatures: EmailSignature[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
  } catch {
    // Storage may be unavailable (private mode); ignore.
  }
}

/** Get the id of the active signature. */
export function getActiveSignatureId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

/** Set the active signature id. */
export function setActiveSignatureId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}

/** Resolve the active signature, falling back to a generated default. */
export function getActiveSignature(
  name: string,
  email: string
): EmailSignature {
  const list = getSignatures();
  const activeId = getActiveSignatureId();
  if (activeId) {
    const found = list.find((s) => s.id === activeId);
    if (found) return found;
  }
  const def = list.find((s) => s.isDefault);
  if (def) return def;
  return generateDefaultSignature(name, email);
}

/** Upsert a signature into the stored list. */
export function upsertSignature(signature: EmailSignature): EmailSignature[] {
  const list = getSignatures();
  const idx = list.findIndex((s) => s.id === signature.id);
  if (idx >= 0) {
    list[idx] = signature;
  } else {
    list.push(signature);
  }
  saveSignatures(list);
  return list;
}

/** Delete a signature by id. */
export function deleteSignature(id: string): EmailSignature[] {
  const list = getSignatures().filter((s) => s.id !== id);
  saveSignatures(list);
  return list;
}
