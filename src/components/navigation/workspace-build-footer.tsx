"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type BuildInfo = {
  repoLabel: string;
  rawLabel: string;
  commitSha: string | null;
  shortSha5: string | null;
};

type RepoFallback = {
  repoLabel: string;
  shortSha5: string;
  commitUrl: string;
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

  const [backendFallback, setBackendFallback] = useState<RepoFallback | null>(null);
  const [webFallback, setWebFallback] = useState<RepoFallback | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/admin/changelog-feed", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((payload) => {
        if (cancelled || !payload) return;

        const repositories = Array.isArray(payload.repositories)
          ? payload.repositories
          : [];
        const backendRepo = repositories.find((repo: any) => repo?.key === "backend");
        const webRepo = repositories.find((repo: any) => repo?.key === "web");
        const latestCommit = backendRepo?.commits?.[0];
        const latestWebCommit = webRepo?.commits?.[0];

        const sha = String(latestCommit?.sha || "").trim();
        const commitUrl = String(latestCommit?.commitUrl || "").trim();

        if (sha && commitUrl) {
          setBackendFallback({
            repoLabel: String(backendRepo?.repo || "reimagined-guide"),
            shortSha5: sha.slice(0, 5),
            commitUrl,
          });
        }

        const webSha = String(latestWebCommit?.sha || "").trim();
        const webCommitUrl = String(latestWebCommit?.commitUrl || "").trim();

        if (webSha && webCommitUrl) {
          setWebFallback({
            repoLabel: String(webRepo?.repo || "misfits-web"),
            shortSha5: webSha.slice(0, 5),
            commitUrl: webCommitUrl,
          });
        }
      })
      .catch(() => {
        // silent fallback
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const webCommitUrl = webFallback?.commitUrl ||
    (web.commitSha
      ? `https://github.com/canatac/misfits-web/commit/${web.commitSha}`
      : null);

  const backendCommitUrl = useMemo(() => {
    if (backend.commitSha) {
      return `https://github.com/canatac/reimagined-guide/commit/${backend.commitSha}`;
    }
    return backendFallback?.commitUrl || null;
  }, [backend.commitSha, backendFallback?.commitUrl]);

  const backendShortSha5 = backend.shortSha5 || backendFallback?.shortSha5 || null;
  const webShortSha5 = webFallback?.shortSha5 || web.shortSha5 || null;
  const webRepoLabel = webFallback?.repoLabel || web.repoLabel;
  const backendRepoLabel =
    backend.shortSha5 || backend.commitSha
      ? backend.repoLabel
      : backendFallback?.repoLabel || backend.repoLabel;

  return (
    <footer
      className={cn(
        "border-t border-[#242427] pt-3 text-[11px] text-[#8A8A92]",
        className || "mt-6"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Web: {webRepoLabel}
          {webShortSha5 ? `@${webShortSha5}` : ` (${web.rawLabel})`}
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
          Backend: {backendRepoLabel}
          {backendShortSha5 ? `@${backendShortSha5}` : ` (${backend.rawLabel})`}
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
