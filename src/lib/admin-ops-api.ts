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

export function transitionAdminChangeRequest(
  payload: TransitionChangeRequestInput
) {
  const { id, ...rest } = payload;
  const encodedId = encodeURIComponent(id);
  return apiClient.patch<TransitionChangeRequestResponse>(
    `/admin/change-requests/${encodedId}`,
    rest,
    { skipAuth: true }
  );
}

export function getAdminUsers() {
  return apiClient.get<AdminUsersResponse>("/admin/users", {
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
