"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BuildInfo = {
  web: {
    label: string;
    commitSha: string | null;
    commitUrl: string | null;
  };
  changelogUrl: string;
};

function extractCommitSha(label: string): string | null {
  const candidate = label.includes("@") ? label.split("@").at(-1) ?? "" : label;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("sha256:")) return null;
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : null;
}

function buildCommitUrl(repo: string, sha: string | null): string | null {
  if (!sha) return null;
  return `https://github.com/${repo}/commit/${sha}`;
}

function fallbackWebLabel(): string {
  const value = process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION || "unknown";
  return value.trim() || "unknown";
}

export function WorkspaceBuildFooter() {
  const [info, setInfo] = useState<BuildInfo | null>(null);

  const fallback = useMemo(() => {
    const label = fallbackWebLabel();
    const commitSha = extractCommitSha(label);
    return {
      web: {
        label,
        commitSha,
        commitUrl: buildCommitUrl("canatac/misfits-web", commitSha),
      },
      changelogUrl: "/admin/changelog",
    } satisfies BuildInfo;
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const resp = await fetch("/api/build-info", { cache: "no-store" });
        if (!resp.ok) return;
        const data = (await resp.json()) as BuildInfo;
        if (!alive) return;
        setInfo(data);
      } catch {
        // no-op: fallback already available
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const view = info ?? fallback;

  return (
    <footer className="mt-6 border-t border-[#242427] pt-3 text-[11px] text-[#8A8A92]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Version: {view.web.label}
          {view.web.commitSha ? ` (${view.web.commitSha.slice(0, 12)})` : ""}
        </span>
        {view.web.commitUrl ? (
          <a
            href={view.web.commitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
          >
            Commit GitHub
          </a>
        ) : null}
        <Link
          href={view.changelogUrl}
          className="text-[#C49B66] underline decoration-dotted underline-offset-2 hover:text-[#E2B677]"
        >
          Changelog
        </Link>
      </div>
    </footer>
  );
}
