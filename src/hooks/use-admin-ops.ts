"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAdminChangeRequest,
  getAdminChangelog,
  getAdminUsers,
  getChangeRequests,
  transitionAdminChangeRequest,
  updateAdminUserRole,
} from "@/lib/admin-ops-api";
import type {
  CreateChangeRequestInput,
  TransitionChangeRequestInput,
  UpdateAdminUserRoleInput,
} from "@/types/admin-ops";

const REFRESH_30S = 30_000;

export function useAdminChangelog() {
  return useQuery({
    queryKey: ["admin", "changelog"],
    queryFn: getAdminChangelog,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useChangeRequests() {
  return useQuery({
    queryKey: ["admin", "change-requests"],
    queryFn: getChangeRequests,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChangeRequestInput) =>
      createAdminChangeRequest(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "change-requests"] });
      toast.success("Change request créée et ajoutée au workflow.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Création impossible.");
    },
  });
}

export function useTransitionChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransitionChangeRequestInput) =>
      transitionAdminChangeRequest(payload),
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "change-requests"] }),
        qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
      ]);
      toast.success("Workflow mis à jour.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Transition impossible.");
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useUpdateAdminUserRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAdminUserRoleInput) => updateAdminUserRole(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rôle utilisateur mis à jour.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Mise à jour du rôle impossible.");
    },
  });
}
