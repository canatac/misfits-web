"use client";

import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { storeSession } from "@/lib/session";
import type { UserRole } from "@/types/auth";
import { ROLE_OPTIONS, makeAvatarOptions } from "../_lib/constants";

export function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const initialDisplayName = user?.displayName?.trim() || "";
  const [firstName, setFirstName] = useState(() => {
    if (!initialDisplayName) return "";
    return initialDisplayName.split(/\s+/)[0] ?? "";
  });
  const [lastName, setLastName] = useState(() => {
    if (!initialDisplayName) return "";
    const parts = initialDisplayName.split(/\s+/);
    return parts.slice(1).join(" ");
  });
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  const avatarOptions = useMemo(() => {
    const seed = user?.email ?? `${firstName}-${lastName}`;
    return makeAvatarOptions(seed);
  }, [user?.email, firstName, lastName]);

  const effectiveAvatar = avatarUrl || avatarOptions[0] || "";

  function handleSaveProfile() {
    if (!user || !session) {
      setProfileFeedback("Session introuvable. Reconnectez-vous puis réessayez.");
      return;
    }
    const displayName = [firstName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();
    const updatedUser = {
      ...user,
      displayName: displayName || user.displayName || user.email.split("@")[0],
      avatarUrl: effectiveAvatar,
      role,
      updatedAt: new Date().toISOString(),
    };
    const updatedSession = { ...session, user: updatedUser };
    useAuthStore.setState({ user: updatedUser, session: updatedSession });
    const remember =
      typeof window !== "undefined" &&
      window.localStorage.getItem("mfa.session") !== null;
    storeSession(updatedSession, remember);
    setProfileFeedback("Profil mis à jour localement (avatar, nom/prénom, rôle).");
  }

  return (
    <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
        Avatar & identité
      </h2>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#C49B66] bg-[#1D1D20]">
          {effectiveAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectiveAvatar}
              alt="Avatar utilisateur"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="text-xs text-[#A1A1AA]">
          Aperçu de l&apos;avatar sélectionné
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2 md:grid-cols-8">
        {avatarOptions.map((url) => {
          const selected = effectiveAvatar === url;
          return (
            <button
              key={url}
              type="button"
              onClick={() => setAvatarUrl(url)}
              className={`rounded-full border-2 p-0.5 ${
                selected
                  ? "border-[#C49B66]"
                  : "border-transparent hover:border-[#C49B66]/50"
              }`}
              aria-label="Choisir cet avatar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Option avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-[#A1A1AA]">Prénom</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
            placeholder="Prénom"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-[#A1A1AA]">Nom</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
            placeholder="Nom"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1">
        <span className="text-xs text-[#A1A1AA]">Rôle</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSaveProfile}
          className="rounded-xl border border-[#C49B66]/70 bg-[#1D1D20] px-4 py-2 text-sm font-semibold text-[#F5D6A2] transition hover:border-[#C49B66] hover:text-white"
        >
          Enregistrer le profil
        </button>

        {profileFeedback ? (
          <p className="text-xs text-[#4ADE80]">{profileFeedback}</p>
        ) : null}
      </div>
    </div>
  );
}
