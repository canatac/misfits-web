"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type BuildInfo = {
  repoLabel: string;
  rawLabel: string;
  commitSha: string | null;
  shortSha5: string | null;
};

function extractCommitSha(label: string): string | null {
  const candidate = label.includes("@") ? label.split("@").at(-1) ?? "" : label;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("sha256:")) return null;
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : null;
}

function normalizeBuildInfo(raw: string, fallbackRepoLabel: string): BuildInfo {
  const label = raw.trim() || "unknown";
  const [repoPartRaw] = label.split("@", 1);
  const repoLabel = repoPartRaw?.trim() || fallbackRepoLabel;
  const commitSha = extractCommitSha(label);

  return {
    repoLabel,
    rawLabel: label,
    commitSha,
    shortSha5: commitSha ? commitSha.slice(0, 5) : null,
  };
}

interface WorkspaceBuildFooterProps {
  className?: string;
}

export function WorkspaceBuildFooter({ className }: WorkspaceBuildFooterProps = {}) {
  const web = normalizeBuildInfo(
    (process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION || "unknown").trim() ||
      "unknown",
    "misfits-web"
  );

  const backend = normalizeBuildInfo(
    (process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION || "unknown").trim() ||
      "unknown",
    "reimagined-guide"
  );

  const webCommitUrl = web.commitSha
    ? `https://github.com/canatac/misfits-web/commit/${web.commitSha}`
    : null;

  const backendCommitUrl = backend.commitSha
    ? `https://github.com/canatac/reimagined-guide/commit/${backend.commitSha}`
    : null;

  return (
    <footer
      className={cn(
        "border-t border-[#242427] pt-3 text-[11px] text-[#8A8A92]",
        className || "mt-6"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Web: {web.repoLabel}
          {web.shortSha5 ? `@${web.shortSha5}` : ` (${web.rawLabel})`}
        </span>
        {webCommitUrl ? (
          <a
            href={webCommitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
          >
            Commit Web
          </a>
        ) : null}

        <span>
          Backend: {backend.repoLabel}
          {backend.shortSha5 ? `@${backend.shortSha5}` : ` (${backend.rawLabel})`}
        </span>
        {backendCommitUrl ? (
          <a
            href={backendCommitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
          >
            Commit Backend
          </a>
        ) : null}

        <Link
          href="/admin/changelog"
          className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
        >
          Changelog
        </Link>
      </div>
    </footer>
  );
}
