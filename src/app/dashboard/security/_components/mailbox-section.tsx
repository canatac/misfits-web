"use client";

import { useAccountStore } from "@/stores/account-store";
import {
  serverConfigLabel,
  type MailboxSecret,
  type MailboxSecretMap,
} from "../_lib/constants";

export function MailboxSection({
  mailboxSecrets,
  upsertMailboxSecret,
  handleSaveMailboxSecrets,
  mailboxFeedback,
}: {
  mailboxSecrets: MailboxSecretMap;
  upsertMailboxSecret: (accountId: string, patch: Partial<MailboxSecret>) => void;
  handleSaveMailboxSecrets: () => void;
  mailboxFeedback: string | null;
}) {
  const accounts = useAccountStore((s) => s.accounts);
  return (
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
            <div
              key={account.id}
              className="rounded-xl border border-[#242427] bg-[#0A0A0B] p-4"
            >
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

              <p className="mb-3 text-xs text-[#A1A1AA]">
                {serverConfigLabel(account)}
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[11px] text-[#71717A]">Login IMAP</span>
                  <input
                    value={secret.imapLogin}
                    onChange={(e) =>
                      upsertMailboxSecret(account.id, {
                        imapLogin: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-[#71717A]">
                    Mot de passe IMAP
                  </span>
                  <input
                    type="password"
                    value={secret.imapPassword}
                    onChange={(e) =>
                      upsertMailboxSecret(account.id, {
                        imapPassword: e.target.value,
                      })
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
                      upsertMailboxSecret(account.id, {
                        smtpLogin: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] text-[#71717A]">
                    Mot de passe SMTP
                  </span>
                  <input
                    type="password"
                    value={secret.smtpPassword}
                    onChange={(e) =>
                      upsertMailboxSecret(account.id, {
                        smtpPassword: e.target.value,
                      })
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
  );
}
