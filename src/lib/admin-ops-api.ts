import { apiClient } from "@/lib/api-client";
import type {
  AdminChangelogResponse,
  AdminUsersResponse,
  ChangeRequestsResponse,
  CreateChangeRequestInput,
  TransitionChangeRequestInput,
  TransitionChangeRequestResponse,
  UpdateAdminUserRoleInput,
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
    { skipAuth: true },
  );
}

export function transitionAdminChangeRequest(payload: TransitionChangeRequestInput) {
  return apiClient.patch<TransitionChangeRequestResponse>(
    "/admin/change-requests",
    payload,
    { skipAuth: true },
  );
}

export function getAdminUsers() {
  return apiClient.get<AdminUsersResponse>("/admin/users", {
    skipAuth: true,
  });
}

export function updateAdminUserRole(payload: UpdateAdminUserRoleInput) {
  return apiClient.patch<{
    user: AdminUsersResponse["users"][number];
    users: AdminUsersResponse["users"];
  }>("/admin/users", payload, { skipAuth: true });
}
