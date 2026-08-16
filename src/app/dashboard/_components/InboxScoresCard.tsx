"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, Inbox } from "lucide-react";
import { formatTime } from "@/components/dashboard/StorageGauge";
import type { Email } from "@/types/email";

type ScoredEmail = Email & { score: number };

export function InboxScoresCard({
  emails,
  onOpen,
}: {
  emails: ScoredEmail[];
  onOpen: (email: ScoredEmail) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-[#C49B66]" />
          <h2 className="text-sm font-bold text-white">Mails du Jour</h2>
        </div>
        <button
          type="button"
          onClick={() => emails[0] && onOpen(emails[0])}
          className="flex items-center gap-0.5 text-[11px] font-medium text-[#C49B66] hover:underline"
        >
          Tout voir <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex-1 space-y-2 px-4 py-3">
        {emails.map((email) => (
          <li key={email.id}>
            <button
              type="button"
              onClick={() => onOpen(email)}
              className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] p-3 text-left transition hover:border-[#C49B66]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-sm font-medium text-[#E4E4E7]">
                  {email.from.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-[#71717A]">
                  {formatTime(email.date)}
                </span>
              </div>
              <p className="truncate text-xs font-semibold text-white">{email.subject}</p>
              <p className="line-clamp-2 text-[11px] text-[#A1A1AA]">{email.preview}</p>
              <div className="mt-1.5">
                <span className="rounded-sm bg-[#C49B66]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#C49B66]">
                  Score {email.score}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#242427] px-4 py-3">
        <Link
          href="/mail"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#C49B66]/50 hover:bg-[#242427]"
        >
          Traiter dans l’inbox{" "}
          <ArrowUpRight className="h-3.5 w-3.5 text-[#C49B66]" />
        </Link>
      </div>
    </div>
  );
}
