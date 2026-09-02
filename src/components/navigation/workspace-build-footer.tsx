"use client";

import Link from "next/link";

function extractCommitSha(label: string): string | null {
  const candidate = label.includes("@") ? label.split("@").at(-1) ?? "" : label;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("sha256:")) return null;
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : null;
}

export function WorkspaceBuildFooter() {
  const label = (process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION || "unknown").trim() ||
    "unknown";
  const commitSha = extractCommitSha(label);
  const commitUrl = commitSha
    ? `https://github.com/canatac/misfits-web/commit/${commitSha}`
    : null;

  return (
    <footer className="mt-6 border-t border-[#242427] pt-3 text-[11px] text-[#8A8A92]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Version: {label}
          {commitSha ? ` (${commitSha.slice(0, 12)})` : ""}
        </span>
        {commitUrl ? (
          <a
            href={commitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
          >
            Commit GitHub
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
