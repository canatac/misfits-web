/**
 * admin-ops-api.ts
 *
 * Thin wrappers around apiClient for the admin panel endpoints.
 *
 * Sprint 3 hardening: all admin calls now use the authenticated client
 * (skipAuth removed). The backend RBAC layer (admin_auth.rs) validates
 * the session token on every request when ADMIN_RBAC_ENFORCE=1.
 *
 * Endpoints reach the backend via Next.js proxy routes (/api/admin/*),
 * which forward the session token through buildForwardHeaders().
 */
import { apiClient } from "@/lib/api-client";
import type {
  AdminAiActivityResponse,
  AdminChangelogResponse,
  AdminUsersResponse,
  ChangeRequestsResponse,
  CreateAdminUserInput,
  CreateChangeRequestInput,
  DeleteAdminUserInput,
  TransitionChangeRequestInput,
  TransitionChangeRequestResponse,
  UpdateAdminUserInput,
} from "@/types/admin-ops";

// ─── Changelog ───────────────────────────────────────────────────────────────

export function getAdminChangelog() {
  return apiClient.get<AdminChangelogResponse>("/admin/changelog-feed", {
    baseUrl: "",
  });
}

// ─── Change requests ─────────────────────────────────────────────────────────

export function getChangeRequests() {
  return apiClient.get<ChangeRequestsResponse>("/admin/change-requests");
}

export function createAdminChangeRequest(payload: CreateChangeRequestInput) {
  return apiClient.post<TransitionChangeRequestResponse>(
    "/admin/change-requests",
    payload
  );
}

const WORKFLOW_ORDER = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
  "rejected",
] as const;

export function transitionAdminChangeRequest(
  payload: TransitionChangeRequestInput
) {
  const { id, action, currentStatus, ...rest } = payload;
  const encodedId = encodeURIComponent(id);

  let body: Record<string, unknown> = { ...rest };

  if (action === "cancel") {
    body.action = "reject";
  } else if (action === "stop") {
    const idx = currentStatus ? WORKFLOW_ORDER.indexOf(currentStatus) : -1;
    if (idx > 0) {
      body.status = WORKFLOW_ORDER[idx - 1];
    } else {
      body.status = "submitted";
    }
  } else {
    body.action = action;
  }

  if (payload.executionRunId) body.executionRunId = payload.executionRunId;
  if (payload.executionError)  body.executionError = payload.executionError;

  return apiClient.patch<TransitionChangeRequestResponse>(
    `/admin/change-requests/${encodedId}`,
    body
  );
}

export function deleteAdminChangeRequest(id: string) {
  const encodedId = encodeURIComponent(id);
  return apiClient.delete<{ deleted: boolean; id: string }>(
    `/admin/change-requests/${encodedId}`
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getAdminUsers() {
  return apiClient.get<AdminUsersResponse>("/admin/users");
}

/**
 * Whoami — introduced in backend PR1 (RBAC foundation).
 *
 * The backend responds with `{ userId, email, role, enforced }`. When
 * `enforced` is false the RBAC flag is OFF and `role` will always be
 * `"admin"` regardless of the caller; when true, the returned role
 * reflects the effective session.
 */
export interface AdminWhoamiResponse {
  userId: string;
  email: string;
  role: "user" | "admin" | "support" | string;
  enforced: boolean;
}

export function getAdminWhoami() {
  return apiClient.get<AdminWhoamiResponse>("/admin/whoami");
}

// ─── User management ─────────────────────────────────────────────────────────

export interface InviteAdminUserResponse {
  invited: boolean;
  user: AdminUsersResponse["users"][number];
  acceptUrl: string;
  expiresAt: string;
}

export function inviteAdminUser(id: string) {
  return apiClient.post<InviteAdminUserResponse>(
    `/admin/users/${encodeURIComponent(id)}/invite`,
    {}
  );
}

export interface ResetAdminPasswordInput {
  newPassword?: string;
  revokeSessions?: boolean;
}
export interface ResetAdminPasswordResponse {
  reset: boolean;
  user: AdminUsersResponse["users"][number];
  /**
   * Vrai si le backend a auto-généré un mot de passe (aucun `newPassword`
   * n'était fourni dans la requête).
   */
  generated: boolean;
  /**
   * Mot de passe en clair — présent UNIQUEMENT quand `generated=true`.
   * L'admin doit le communiquer au propriétaire hors-bande, puis exiger
   * un changement à la prochaine connexion.
   */
  password: string | null;
}

export function resetAdminPassword(
  id: string,
  payload: ResetAdminPasswordInput = {}
) {
  return apiClient.post<ResetAdminPasswordResponse>(
    `/admin/users/${encodeURIComponent(id)}/reset-password`,
    payload
  );
}

export interface AdminAuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetKind: string;
  targetId: string;
  note?: string | null;
  diff?: unknown;
}
export interface AdminAuditLogResponse {
  generatedAt: string;
  entries: AdminAuditEntry[];
}

export function getAdminAuditLog(
  params: {
    target?: string;
    actor?: string;
    action?: string;
    limit?: number;
  } = {}
) {
  const search = new URLSearchParams();
  if (params.target) search.set("target", params.target);
  if (params.actor)  search.set("actor",  params.actor);
  if (params.action) search.set("action", params.action);
  if (params.limit)  search.set("limit",  String(params.limit));
  const suffix = search.toString();
  return apiClient.get<AdminAuditLogResponse>(
    `/admin/audit-log${suffix ? `?${suffix}` : ""}`
  );
}

export function createAdminUser(payload: CreateAdminUserInput) {
  return apiClient.post<{ user: AdminUsersResponse["users"][number] }>(
    "/admin/users",
    payload
  );
}

export function updateAdminUser(payload: UpdateAdminUserInput) {
  return apiClient.patch<{ user: AdminUsersResponse["users"][number] }>(
    "/admin/users",
    payload
  );
}

export function deleteAdminUser(payload: DeleteAdminUserInput) {
  const id = encodeURIComponent(payload.id);
  return apiClient.delete<{ deleted: boolean; id: string }>(
    `/admin/users?id=${id}`
  );
}

export function getAdminAiActivity(limit = 40) {
  return apiClient.get<AdminAiActivityResponse>(
    `/admin/ai-activity?limit=${limit}`
  );
}
