"use client";

import {
  useAdminAiActivity,
  useAdminAuditLog,
  useAdminChangelog,
  useAdminUsers,
  useAdminWhoami,
  useChangeRequests,
  useCreateAdminUser,
  useCreateChangeRequest,
  useDeleteChangeRequest,
  useDeleteAdminUser,
  useInviteAdminUser,
  useResetAdminPassword,
  useStartImplementationChangeRequest,
  useTransitionChangeRequest,
  useUpdateAdminUser,
} from "@/hooks/use-admin-ops";

export function useAdminMutations() {
  const adminChangelog = useAdminChangelog();
  const changeRequests = useChangeRequests();
  const adminUsers = useAdminUsers();
  const whoami = useAdminWhoami();
  const inviteAdminUser = useInviteAdminUser();
  const resetAdminPassword = useResetAdminPassword();
  const adminAuditLog = useAdminAuditLog(100);
  const adminAiActivity = useAdminAiActivity(50);
  const createChangeRequest = useCreateChangeRequest();
  const transitionChangeRequest = useTransitionChangeRequest();
  const deleteChangeRequest = useDeleteChangeRequest();
  const startImplementationChangeRequest =
    useStartImplementationChangeRequest();
  const updateAdminUser = useUpdateAdminUser();
  const createAdminUser = useCreateAdminUser();
  const deleteAdminUser = useDeleteAdminUser();

  return {
    adminChangelog,
    changeRequests,
    adminUsers,
    whoami,
    inviteAdminUser,
    resetAdminPassword,
    adminAuditLog,
    adminAiActivity,
    createChangeRequest,
    transitionChangeRequest,
    deleteChangeRequest,
    startImplementationChangeRequest,
    updateAdminUser,
    createAdminUser,
    deleteAdminUser,
  };
}
