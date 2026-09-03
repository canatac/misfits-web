"use client";

import Link from "next/link";
import { ArrowUpRight, Inbox, Sparkles } from "lucide-react";
import type { Email } from "@/types/email";
import type { DashboardDailyMailSummary } from "../types";

type ScoredEmail = Email & { score: number };

function fallbackSummary(priorityEmails: ScoredEmail[]): DashboardDailyMailSummary {
  if (priorityEmails.length === 0) {
    return {
      pendingActions: ["Aucun mail récent sur les dernières 24h."],
      exchangedInfo: ["Pas de nouvel échange à résumer."],
      priorityEmails: [],
      generatedAt: new Date().toISOString(),
      source: "rules",
    };
  }

  return {
    pendingActions: [
      `Traiter ${priorityEmails.filter((email) => !email.isRead).length} mail(s) non lu(s).`,
      "Vérifier les messages avec score prioritaire élevé.",
    ],
    exchangedInfo: priorityEmails.slice(0, 3).map((email) => {
      const sender = email.from.name || email.from.address;
      return `${sender}: ${email.subject}`;
    }),
    priorityEmails: priorityEmails.slice(0, 3).map((email) => ({
      emailId: email.id,
      subject: email.subject,
      from: email.from.name || email.from.address,
      reason: !email.isRead ? "Non lu" : "Signal élevé",
      priorityScore: email.score,
    })),
    generatedAt: new Date().toISOString(),
    source: "rules",
  };
}

export function InboxScoresCard({
  summary,
  isLoading,
  priorityEmails,
  onOpen,
}: {
  summary: DashboardDailyMailSummary | undefined;
  isLoading: boolean;
  priorityEmails: ScoredEmail[];
  onOpen: (email: ScoredEmail) => void;
}) {
  const resolvedSummary = summary ?? fallbackSummary(priorityEmails);

  const linkedPriority = resolvedSummary.priorityEmails
    .map((priority) => {
      const email = priorityEmails.find((candidate) => candidate.id === priority.emailId);
      if (!email) return null;
      return { priority, email };
    })
    .filter((item): item is { priority: DashboardDailyMailSummary["priorityEmails"][number]; email: ScoredEmail } => Boolean(item));

  return (
    <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-[#C49B66]" />
          <h2 className="text-sm font-bold text-white">Mails du Jour</h2>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A1A1AA]">
          <Sparkles className="h-3 w-3" />
          {resolvedSummary.source === "ai" ? "Résumé IA" : "Résumé"}
        </span>
      </div>

      <div className="flex-1 space-y-3 px-4 py-3 text-[12px]">
        {isLoading ? (
          <p className="text-[#A1A1AA]">Analyse des échanges des dernières 24h…</p>
        ) : (
          <>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#C49B66]">
                Actions en attente
              </p>
              <ul className="space-y-1 text-[#D4D4D8]">
                {resolvedSummary.pendingActions.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#C49B66]">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#60A5FA]">
                Infos échangées (24h)
              </p>
              <ul className="space-y-1 text-[#D4D4D8]">
                {resolvedSummary.exchangedInfo.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-[#60A5FA]">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#4ADE80]">
                Mails prioritaires
              </p>
              {linkedPriority.length === 0 ? (
                <p className="text-[#A1A1AA]">Aucun lien prioritaire disponible.</p>
              ) : (
                <ul className="space-y-2">
                  {linkedPriority.map(({ priority, email }) => (
                    <li key={priority.emailId}>
                      <button
                        type="button"
                        onClick={() => onOpen(email)}
                        className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] p-2.5 text-left transition hover:border-[#4ADE80]/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-white">{priority.subject}</span>
                          <span className="rounded-sm bg-[#4ADE80]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#4ADE80]">
                            {priority.priorityScore}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[#A1A1AA]">{priority.from}</p>
                        <p className="line-clamp-2 text-[11px] text-[#D4D4D8]">{priority.reason}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[#242427] px-4 py-3">
        <Link
          href="/mail"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50 hover:bg-[#242427]"
        >
          Traiter dans l’inbox <ArrowUpRight className="h-3.5 w-3.5 text-[#C49B66]" />
        </Link>
      </div>
    </div>
  );
}
