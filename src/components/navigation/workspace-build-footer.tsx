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

/** The build labels of the environment. On the server they are read when it
 * runs; in the browser, when the bundle was built: in production they differ
 * (misfits-web#1254, Minified React error #418 on /mail), so they are read
 * only once mounted, never in the render the server and the browser share. */
function environmentBuilds(): { web: BuildInfo; backend: BuildInfo } {
  return {
    web: normalizeBuildInfo(
      (process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION || "unknown").trim() ||
        "unknown",
      "misfits-web"
    ),
    backend: normalizeBuildInfo(
      (process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION || "unknown").trim() ||
        "unknown",
      "reimagined-guide"
    ),
  };
}

const UNKNOWN_BUILDS = {
  web: normalizeBuildInfo("unknown", "misfits-web"),
  backend: normalizeBuildInfo("unknown", "reimagined-guide"),
};

export function WorkspaceBuildFooter({ className }: WorkspaceBuildFooterProps = {}) {
  // The same first render on the server and in the browser (#1254).
  const [staticBuilds, setStaticBuilds] = useState(UNKNOWN_BUILDS);
  useEffect(() => {
    setStaticBuilds(environmentBuilds());
  }, []);
  const staticWeb = staticBuilds.web;
  const staticBackend = staticBuilds.backend;

  const [runtimeBuilds, setRuntimeBuilds] = useState<{
    web: BuildInfo;
    backend: BuildInfo;
  } | null>(null);

  const [backendFallback, setBackendFallback] = useState<RepoFallback | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeBuildMeta = async () => {
      const endpoints = ["/build-meta", "/api/build-meta"];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Pragma: "no-cache",
              "Cache-Control": "no-cache",
            },
          });
          if (!res.ok) continue;
          const payload = await res.json().catch(() => null);
          if (!payload || cancelled) return;

          const webLabel = String(payload.webLabel || "unknown").trim() || "unknown";
          const backendLabel =
            String(payload.backendLabel || "unknown").trim() || "unknown";

          setRuntimeBuilds({
            web: normalizeBuildInfo(webLabel, "misfits-web"),
            backend: normalizeBuildInfo(backendLabel, "reimagined-guide"),
          });
          return;
        } catch {
          // try next endpoint
        }
      }
    };

    void loadRuntimeBuildMeta();

    return () => {
      cancelled = true;
    };
  }, []);

  const web = runtimeBuilds?.web || staticWeb;
  const backend = runtimeBuilds?.backend || staticBackend;

  useEffect(() => {
    let cancelled = false;

    if (backend.shortSha5 && backend.commitSha) {
      return;
    }

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
        const latestCommit = backendRepo?.commits?.[0];

        const sha = String(latestCommit?.sha || "").trim();
        const commitUrl = String(latestCommit?.commitUrl || "").trim();

        if (!sha || !commitUrl) return;

        setBackendFallback({
          repoLabel: String(backendRepo?.repo || "reimagined-guide"),
          shortSha5: sha.slice(0, 5),
          commitUrl,
        });
      })
      .catch(() => {
        // silent fallback
      });

    return () => {
      cancelled = true;
    };
  }, [backend.commitSha, backend.shortSha5]);

  const webCommitUrl = web.commitSha
    ? `https://github.com/canatac/misfits-web/commit/${web.commitSha}`
    : null;

  const backendCommitUrl = useMemo(() => {
    if (backend.commitSha) {
      return `https://github.com/canatac/reimagined-guide/commit/${backend.commitSha}`;
    }
    return backendFallback?.commitUrl || null;
  }, [backend.commitSha, backendFallback?.commitUrl]);

  const backendShortSha5 = backend.shortSha5 || backendFallback?.shortSha5 || null;
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
