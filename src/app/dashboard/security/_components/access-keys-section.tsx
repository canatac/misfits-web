"use client";

import { useAuthStore } from "@/stores/auth-store";
import { maskSecret } from "../_lib/constants";

export function AccessKeysSection() {
  const session = useAuthStore((s) => s.session);
  return (
    <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
      <h2 className="mb-1 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
        Clés d&apos;accès (session)
      </h2>
      <p className="mb-4 text-xs text-[#A1A1AA]">
        Vue masquée des identifiants actifs de session.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
          <p className="text-[#71717A]">Session ID</p>
          <p className="mt-1 font-mono text-[#D4D4D8]">
            {maskSecret(session?.id ?? "")}
          </p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
          <p className="text-[#71717A]">Access token</p>
          <p className="mt-1 font-mono text-[#D4D4D8]">
            {maskSecret(session?.accessToken ?? "")}
          </p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
          <p className="text-[#71717A]">Refresh token</p>
          <p className="mt-1 font-mono text-[#D4D4D8]">
            {maskSecret(session?.refreshToken ?? "")}
          </p>
        </div>
        <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
          <p className="text-[#71717A]">Expiration access token</p>
          <p className="mt-1 text-[#D4D4D8]">
            {session?.expiresAt
              ? new Date(session.expiresAt).toLocaleString("fr-FR")
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
