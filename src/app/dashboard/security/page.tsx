"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useAccountStore } from "@/stores/account-store";
import { storeSession } from "@/lib/session";
import {
  AI_FEATURE_KEYS,
  DEFAULT_AI_MODEL,
  defaultAiSettings,
  type AiSettings,
} from "@/types/ai-settings";
import { fetchAiSettings, saveAiSettings } from "@/lib/ai-settings";
import type { UserRole } from "@/types/auth";
import type { EmailAccount } from "@/types/account";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "Utilisateur" },
  { value: "support", label: "Support" },
  { value: "admin", label: "Admin" },
];

const LLM_PROVIDER_OPTIONS = [
  "openrouter",
  "openai",
  "anthropic",
  "groq",
  "custom",
] as const;

type LlmProvider = (typeof LLM_PROVIDER_OPTIONS)[number];

type MailboxSecret = {
  imapLogin: string;
  imapPassword: string;
  smtpLogin: string;
  smtpPassword: string;
};

type MailboxSecretMap = Record<string, MailboxSecret>;

type LlmSecrets = Record<LlmProvider, string>;

const STORAGE_MAILBOX_KEYS = "misfits.security.mailbox-secrets";
const STORAGE_LLM_KEYS = "misfits.security.llm-secrets";
const STORAGE_LLM_PROVIDER = "misfits.security.llm-provider";

function makeAvatarOptions(seed: string): string[] {
  const sanitized = seed.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") || "user";
  return Array.from({ length: 8 }, (_, idx) =>
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(`${sanitized}-${idx + 1}`)}`
  );
}

function maskSecret(value: string): string {
  if (!value) return "—";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

function serverConfigLabel(account: EmailAccount): string {
  const c = account.serverConfig;
  if (!c) return "Preset provider";
  return `IMAP ${c.imapHost}:${c.imapPort} (${c.imapSecurity}) • SMTP ${c.smtpHost}:${c.smtpPort} (${c.smtpSecurity})`;
}

export default function DashboardSecurityPage() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const accounts = useAccountStore((s) => s.accounts);

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
  const [mailboxFeedback, setMailboxFeedback] = useState<string | null>(null);
  const [llmFeedback, setLlmFeedback] = useState<string | null>(null);

  const [mailboxSecrets, setMailboxSecrets] = useState<MailboxSecretMap>({});
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("openrouter");
  const [llmSecrets, setLlmSecrets] = useState<LlmSecrets>({
    openrouter: "",
    openai: "",
    anthropic: "",
    groq: "",
    custom: "",
  });
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings());
  const [llmSaving, setLlmSaving] = useState(false);

  const avatarOptions = useMemo(() => {
    const seed = user?.email ?? `${firstName}-${lastName}`;
    return makeAvatarOptions(seed);
  }, [user?.email, firstName, lastName]);

  const effectiveAvatar = avatarUrl || avatarOptions[0] || "";

  useEffect(() => {
    try {
      const rawMailbox = window.localStorage.getItem(STORAGE_MAILBOX_KEYS);
      if (rawMailbox) {
        const parsed = JSON.parse(rawMailbox) as MailboxSecretMap;
        setMailboxSecrets(parsed || {});
      }

      const rawLlm = window.localStorage.getItem(STORAGE_LLM_KEYS);
      if (rawLlm) {
        const parsed = JSON.parse(rawLlm) as Partial<LlmSecrets>;
        setLlmSecrets((prev) => ({ ...prev, ...parsed }));
      }

      const rawProvider = window.localStorage.getItem(STORAGE_LLM_PROVIDER);
      if (
        rawProvider &&
        LLM_PROVIDER_OPTIONS.includes(rawProvider as LlmProvider)
      ) {
        setLlmProvider(rawProvider as LlmProvider);
      }
    } catch {
      // ignore malformed local cache
    }

    let mounted = true;
    fetchAiSettings()
      .then((settings) => {
        if (!mounted) return;
        setAiSettings(settings);
      })
      .catch(() => {
        // fallback already handled in client
      });

    return () => {
      mounted = false;
    };
  }, []);

  function upsertMailboxSecret(accountId: string, patch: Partial<MailboxSecret>) {
    setMailboxSecrets((prev) => {
      const nextForAccount: MailboxSecret = {
        imapLogin: prev[accountId]?.imapLogin || "",
        imapPassword: prev[accountId]?.imapPassword || "",
        smtpLogin: prev[accountId]?.smtpLogin || "",
        smtpPassword: prev[accountId]?.smtpPassword || "",
        ...patch,
      };
      return {
        ...prev,
        [accountId]: nextForAccount,
      };
    });
  }

  function handleSaveProfile() {
    if (!user || !session) {
      setProfileFeedback("Session introuvable. Reconnectez-vous puis réessayez.");
      return;
    }

    const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();

    const updatedUser = {
      ...user,
      displayName: displayName || user.displayName || user.email.split("@")[0],
      avatarUrl: effectiveAvatar,
      role,
      updatedAt: new Date().toISOString(),
    };

    const updatedSession = {
      ...session,
      user: updatedUser,
    };

    useAuthStore.setState({ user: updatedUser, session: updatedSession });

    const remember =
      typeof window !== "undefined" &&
      window.localStorage.getItem("mfa.session") !== null;

    storeSession(updatedSession, remember);
    setProfileFeedback("Profil mis à jour localement (avatar, nom/prénom, rôle).");
  }

  function handleSaveMailboxSecrets() {
    try {
      window.localStorage.setItem(STORAGE_MAILBOX_KEYS, JSON.stringify(mailboxSecrets));
      setMailboxFeedback("Clés et identifiants IMAP/SMTP sauvegardés localement.");
    } catch {
      setMailboxFeedback("Impossible de sauvegarder les clés mailbox localement.");
    }
  }

  async function handleSaveLlmSettings() {
    setLlmSaving(true);
    try {
      window.localStorage.setItem(STORAGE_LLM_KEYS, JSON.stringify(llmSecrets));
      window.localStorage.setItem(STORAGE_LLM_PROVIDER, llmProvider);

      const saved = await saveAiSettings({
        defaultModel: aiSettings.defaultModel,
        features: aiSettings.features,
      });
      setAiSettings(saved);
      setLlmFeedback("Configuration LLM sauvegardée (provider local + modèles système). ");
    } catch {
      setLlmFeedback(
        "Sauvegarde partielle: clés locales OK, mais la sauvegarde des modèles système a échoué."
      );
    } finally {
      setLlmSaving(false);
    }
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-[#242427] bg-[#121214] p-6 text-[#E0E0E0]">
        <h1 className="text-xl font-semibold text-white">Gestion du Compte & Sécurité</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Aucune session utilisateur active. Merci de vous reconnecter.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 text-[#E0E0E0]">
      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <h1 className="text-xl font-semibold text-white">Gestion du Compte & Sécurité</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Profil, clés d&apos;accès, boîtes agrégées, et configuration LLM.
        </p>
      </div>

      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
          Avatar & identité
        </h2>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#C49B66] bg-[#1D1D20]">
            {effectiveAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={effectiveAvatar} alt="Avatar utilisateur" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="text-xs text-[#A1A1AA]">Aperçu de l&apos;avatar sélectionné</div>
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
                <img src={url} alt="Option avatar" className="h-10 w-10 rounded-full object-cover" />
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
            <p className="mt-1 font-mono text-[#D4D4D8]">{maskSecret(session?.id ?? "")}</p>
          </div>
          <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
            <p className="text-[#71717A]">Access token</p>
            <p className="mt-1 font-mono text-[#D4D4D8]">{maskSecret(session?.accessToken ?? "")}</p>
          </div>
          <div className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-xs">
            <p className="text-[#71717A]">Refresh token</p>
            <p className="mt-1 font-mono text-[#D4D4D8]">{maskSecret(session?.refreshToken ?? "")}</p>
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

      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
          Boîtes mail agrégées
        </h2>
        <p className="mb-4 text-xs text-[#A1A1AA]">
          Configuration provider + IMAP/SMTP + clés par boîte.
        </p>

        <div className="space-y-4">
          {accounts.map((account) => {
            const secret = mailboxSecrets[account.id] || {
              imapLogin: account.email,
              imapPassword: "",
              smtpLogin: account.email,
              smtpPassword: "",
            };
            return (
              <div key={account.id} className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#2D2D31] px-2 py-0.5 text-[10px] uppercase text-[#A1A1AA]">
                    {account.provider}
                  </span>
                  {account.isDefault ? (
                    <span className="rounded-full border border-[#C49B66]/50 px-2 py-0.5 text-[10px] text-[#F5D6A2]">
                      Compte par défaut
                    </span>
                  ) : null}
                  <span className="text-xs text-white">{account.email}</span>
                </div>

                <p className="mb-3 text-xs text-[#A1A1AA]">{serverConfigLabel(account)}</p>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] text-[#71717A]">Login IMAP</span>
                    <input
                      value={secret.imapLogin}
                      onChange={(e) =>
                        upsertMailboxSecret(account.id, { imapLogin: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-[#71717A]">Mot de passe IMAP</span>
                    <input
                      type="password"
                      value={secret.imapPassword}
                      onChange={(e) =>
                        upsertMailboxSecret(account.id, { imapPassword: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                      placeholder="••••••••"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-[#71717A]">Login SMTP</span>
                    <input
                      value={secret.smtpLogin}
                      onChange={(e) =>
                        upsertMailboxSecret(account.id, { smtpLogin: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-[#71717A]">Mot de passe SMTP</span>
                    <input
                      type="password"
                      value={secret.smtpPassword}
                      onChange={(e) =>
                        upsertMailboxSecret(account.id, { smtpPassword: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                      placeholder="••••••••"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveMailboxSecrets}
            className="rounded-xl border border-[#3A7A45]/70 bg-[#152018] px-4 py-2 text-sm font-semibold text-[#9BE9A8] transition hover:border-[#3A7A45] hover:text-white"
          >
            Sauvegarder les clés mailbox
          </button>
          {mailboxFeedback ? (
            <p className="text-xs text-[#4ADE80]">{mailboxFeedback}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <h2 className="mb-1 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
          LLM (provider, modèles, clés API)
        </h2>
        <p className="mb-4 text-xs text-[#A1A1AA]">
          Choix du provider LLM + clé API locale + mapping des modèles système.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-[#A1A1AA]">Provider LLM actif</span>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value as LlmProvider)}
              className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
            >
              {LLM_PROVIDER_OPTIONS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-[#A1A1AA]">Modèle par défaut système</span>
            <input
              value={aiSettings.defaultModel || DEFAULT_AI_MODEL}
              onChange={(e) =>
                setAiSettings((prev) => ({
                  ...prev,
                  defaultModel: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
              placeholder="qwen/qwen3.7-flash"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {LLM_PROVIDER_OPTIONS.map((provider) => (
            <label key={provider} className="space-y-1">
              <span className="text-[11px] text-[#71717A]">API key {provider}</span>
              <input
                type="password"
                value={llmSecrets[provider] || ""}
                onChange={(e) =>
                  setLlmSecrets((prev) => ({
                    ...prev,
                    [provider]: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#C49B66]"
                placeholder="sk-..."
              />
            </label>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <h3 className="mb-3 text-xs font-semibold text-[#A1A1AA]">
            Modèles par fonctionnalité
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {AI_FEATURE_KEYS.map((featureKey) => (
              <label key={featureKey} className="space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#71717A]">
                  {featureKey}
                </span>
                <input
                  value={aiSettings.features?.[featureKey] || aiSettings.defaultModel}
                  onChange={(e) =>
                    setAiSettings((prev) => ({
                      ...prev,
                      features: {
                        ...prev.features,
                        [featureKey]: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                  placeholder="provider/model"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveLlmSettings}
            disabled={llmSaving}
            className="rounded-xl border border-[#4F46E5]/70 bg-[#191A2C] px-4 py-2 text-sm font-semibold text-[#B7B3FF] transition hover:border-[#4F46E5] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {llmSaving ? "Sauvegarde..." : "Sauvegarder LLM"}
          </button>

          {llmFeedback ? <p className="text-xs text-[#4ADE80]">{llmFeedback}</p> : null}
        </div>
      </div>
    </section>
  );
}
