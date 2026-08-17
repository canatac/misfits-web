"use client";

/**
 * useAdminConsoleFormState — bundles the transient form/dialog state
 * (new change-request draft, new admin user, transition note, delete
 * dialog target) used by the admin console page.
 */
import { useState } from "react";
import type {
  CreateAdminUserInput,
  CreateChangeRequestInput,
} from "@/types/admin-ops";

export function useAdminConsoleFormState() {
  const [newRequest, setNewRequest] = useState<CreateChangeRequestInput>({
    title: "",
    problem: "",
    desiredOutcome: "",
    scope: "fullstack",
    urgency: "medium",
    impact: "medium",
    requestedBy: "admin",
    linkedRepo: "cross-repo",
  });
  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    displayName: "",
    role: "user",
    status: "active",
    twoFactorEnabled: false,
  });
  const [transitionNote, setTransitionNote] = useState("");
  const [deleteDialogTarget, setDeleteDialogTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  return {
    newRequest,
    setNewRequest,
    newAdminUser,
    setNewAdminUser,
    transitionNote,
    setTransitionNote,
    deleteDialogTarget,
    setDeleteDialogTarget,
  };
}
