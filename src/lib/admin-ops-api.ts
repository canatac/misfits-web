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

export function getAdminChangelog() {
  return apiClient.get<AdminChangelogResponse>("/admin/changelog", {
    skipAuth: true,
  });
}

export function getChangeRequests() {
  return apiClient.get<ChangeRequestsResponse>("/admin/change-requests", {
    skipAuth: true,
  });
}

export function createAdminChangeRequest(payload: CreateChangeRequestInput) {
  return apiClient.post<TransitionChangeRequestResponse>(
    "/admin/change-requests",
    payload,
    { skipAuth: true }
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

  if (payload.executionRunId) {
    body.executionRunId = payload.executionRunId;
  }
  if (payload.executionError) {
    body.executionError = payload.executionError;
  }

  return apiClient.patch<TransitionChangeRequestResponse>(
    `/admin/change-requests/${encodedId}`,
    body,
    { skipAuth: true }
  );
}

export function deleteAdminChangeRequest(id: string) {
  const encodedId = encodeURIComponent(id);
  return apiClient.delete<{ deleted: boolean; id: string }>(
    `/admin/change-requests?id=${encodedId}`,
    { skipAuth: true }
  );
}

export function getAdminUsers() {
  return apiClient.get<AdminUsersResponse>("/admin/users", {
    skipAuth: true,
  });
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
  return apiClient.get<AdminWhoamiResponse>("/admin/whoami", {
    skipAuth: true,
  });
}

export function createAdminUser(payload: CreateAdminUserInput) {
  return apiClient.post<{ user: AdminUsersResponse["users"][number] }>(
    "/admin/users",
    payload,
    { skipAuth: true }
  );
}

export function updateAdminUser(payload: UpdateAdminUserInput) {
  return apiClient.patch<{ user: AdminUsersResponse["users"][number] }>(
    "/admin/users",
    payload,
    { skipAuth: true }
  );
}

export function deleteAdminUser(payload: DeleteAdminUserInput) {
  const id = encodeURIComponent(payload.id);
  return apiClient.delete<{ deleted: boolean; id: string }>(
    `/admin/users?id=${id}`,
    {
      skipAuth: true,
    }
  );
}

export function getAdminAiActivity(limit = 40) {
  return apiClient.get<AdminAiActivityResponse>(
    `/admin/ai-activity?limit=${limit}`,
    {
      skipAuth: true,
    }
  );
}
