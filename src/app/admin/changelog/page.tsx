"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, History, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type CommitItem = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  committedAt: string;
  commitUrl: string;
  workflowUrl: string | null;
  workflowName: string | null;
};

type RepoPayload = {
  key: "web" | "backend";
  owner: string;
  repo: string;
  latestShortSha: string;
  commits: CommitItem[];
};

type ApiPayload = {
  generatedAt: string;
  repositories: RepoPayload[];
};

function formatDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function AdminChangelogPage() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/changelog", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Erreur chargement changelog");
      }
      setData(json as ApiPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const webRepo = useMemo(
    () => data?.repositories.find((r) => r.key === "web") || null,
    [data],
  );
  const backendRepo = useMemo(
    () => data?.repositories.find((r) => r.key === "backend") || null,
    [data],
  );

  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs">
          <History className="h-3.5 w-3.5" />
          Changelog
        </div>
        <h1 className="text-2xl font-bold">Changelog Admin</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          web: {webRepo?.latestShortSha || "—"} - backend: {backendRepo?.latestShortSha || "—"}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCcw className="mr-1 h-3.5 w-3.5" />
            Rafraîchir
          </Button>
          {data?.generatedAt && (
            <span className="text-xs text-[var(--color-muted-fg)]">
              Mis à jour: {formatDate(data.generatedAt)}
            </span>
          )}
        </div>
      </header>

      {loading && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted-fg)]">
          Chargement du changelog…
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-400)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-danger-500)]">
          {error}
        </div>
      )}

      {!loading && !error && data?.repositories.map((repo) => (
        <article
          key={repo.key}
          className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]"
        >
          <header className="border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-base font-semibold">
              {repo.key === "web" ? "Web" : "Backend"} · {repo.owner}/{repo.repo}
            </h2>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-fg)]">
                  <th className="px-4 py-2 font-medium">Commit</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Auteur</th>
                  <th className="px-4 py-2 font-medium">Message</th>
                  <th className="px-4 py-2 font-medium">Workflow</th>
                </tr>
              </thead>
              <tbody>
                {repo.commits.map((commit) => (
                  <tr key={commit.sha} className="border-b border-[var(--color-border)] last:border-b-0">
                    <td className="px-4 py-2 font-mono text-xs">
                      <a href={commit.commitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        {commit.shortSha}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-2">{formatDate(commit.committedAt)}</td>
                    <td className="px-4 py-2">{commit.author}</td>
                    <td className="max-w-[520px] truncate px-4 py-2" title={commit.message}>{commit.message}</td>
                    <td className="px-4 py-2">
                      {commit.workflowUrl ? (
                        <a href={commit.workflowUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          {commit.workflowName || "Workflow"}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[var(--color-muted-fg)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}

      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Retour Admin</Link>
        </Button>
      </div>
    </section>
  );
}
