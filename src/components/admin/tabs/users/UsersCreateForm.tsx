"use client";

// UsersCreateForm — extracted from UsersTab.tsx (cycle63).
import type { FormEvent } from "react";
import type { AdminUserRecord, CreateAdminUserInput } from "@/types/admin-ops";

interface UsersCreateFormProps {
  newAdminUser: CreateAdminUserInput;
  setNewAdminUser: React.Dispatch<React.SetStateAction<CreateAdminUserInput>>;
  isPending: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function UsersCreateForm({
  newAdminUser,
  setNewAdminUser,
  isPending,
  onSubmit,
}: UsersCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3"
    >
      <p className="text-xs text-[#A1A1AA]">Créer un utilisateur</p>
      <div className="mt-2 grid gap-2 md:grid-cols-5">
        <input
          value={newAdminUser.email}
          onChange={(e) => setNewAdminUser((prev) => ({ ...prev, email: e.target.value }))}
          required
          type="email"
          className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
          placeholder="email@misfits.ai"
        />
        <input
          value={newAdminUser.displayName || ""}
          onChange={(e) => setNewAdminUser((prev) => ({ ...prev, displayName: e.target.value }))}
          className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
          placeholder="Nom affiché"
        />
        <select
          value={newAdminUser.role}
          onChange={(e) =>
            setNewAdminUser((prev) => ({ ...prev, role: e.target.value as AdminUserRecord["role"] }))
          }
          className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
        >
          <option value="user">user</option>
          <option value="support">support</option>
          <option value="admin">admin</option>
        </select>
        <select
          value={newAdminUser.status}
          onChange={(e) =>
            setNewAdminUser((prev) => ({ ...prev, status: e.target.value as AdminUserRecord["status"] }))
          }
          className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
        >
          <option value="active">active</option>
          <option value="restricted">restricted</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border border-[#3A3A42] px-2 py-1.5 text-xs text-[#E4E4E7] disabled:opacity-50"
        >
          {isPending ? "Création..." : "Créer"}
        </button>
      </div>
    </form>
  );
}
