"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { AdminChangelogResponse } from "@/types/admin-ops";
import { Badge, priorityTone, asDate } from "../shared";

interface ChangelogTabProps {
  adminChangelog: UseQueryResult<AdminChangelogResponse, Error>;
}

export function ChangelogTab({ adminChangelog }: ChangelogTabProps) {
  return (
    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#E4E4E7]">
            Changelog Admin
          </h2>
          <p className="mt-1 text-xs text-[#71717A]">
            Flux consolidé GitHub + releases issues du workflow Change Request.
          </p>
        </div>
        <Badge tone={adminChangelog.isFetching ? "warn" : "ok"}>
          {adminChangelog.isFetching ? "refreshing" : "live"}
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {!!adminChangelog.data?.warnings?.length && (
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-xs text-amber-200 xl:col-span-3">
            <p className="font-medium">Mode dégradé partiel</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {adminChangelog.data.warnings.map((warning, idx) => (
                <li key={`${warning}_${idx}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-1">
          <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
            Releases issues du workflow
          </h3>
          <div className="mt-3 space-y-2">
            {(adminChangelog.data?.workflowReleases ?? []).map((release) => (
              <div
                key={release.id}
                className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[#E4E4E7]">{release.title}</p>
                  <Badge tone={priorityTone(release.priority)}>
                    {release.priority}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#A1A1AA]">{release.summary}</p>
                <p className="mt-1 text-[11px] text-[#71717A]">
                  {asDate(release.releasedAt)} · {release.scope} ·{" "}
                  {release.sourceType === "pull_request" ? (
                    release.pullRequestUrl ? (
                      <a
                        href={release.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Ouvrir ${release.sourceChangeRequestId} dans GitHub (nouvel onglet)`}
                        className="text-[#86EFAC] hover:underline"
                      >
                        {release.sourceChangeRequestId}
                      </a>
                    ) : (
                      release.sourceChangeRequestId
                    )
                  ) : (
                    release.sourceChangeRequestId
                  )}
                </p>
              </div>
            ))}
            {!adminChangelog.data?.workflowReleases?.length && (
              <p className="text-xs text-[#71717A]">
                Aucune release issue d&apos;une change request pour le moment.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
          <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
            Commits récents
          </h3>
          <div className="mt-3 space-y-3">
            {(adminChangelog.data?.repositories ?? []).map((repo) => (
              <div
                key={repo.key}
                className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-[#E4E4E7]">
                    {repo.owner}/{repo.repo}
                  </p>
                  <Badge>{repo.latestShortSha}</Badge>
                </div>
                <div className="space-y-2">
                  {repo.commits.slice(0, 6).map((commit) => (
                    <div
                      key={commit.sha}
                      className="rounded-md border border-[#242429] bg-[#141419] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={commit.commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={`${commit.shortSha} · ${commit.message}`}
                          aria-label={`Ouvrir le commit ${commit.shortSha} dans GitHub (nouvel onglet)`}
                          className="truncate text-xs font-medium text-[#F2D5A7] hover:underline"
                        >
                          {commit.shortSha} · {commit.message}
                        </a>
                        {commit.workflowUrl ? (
                          <a
                            href={commit.workflowUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Ouvrir le workflow ${commit.workflowName || "workflow"} pour ${commit.shortSha} (nouvel onglet)`}
                            className="text-[11px] text-[#86EFAC] hover:underline"
                          >
                            {commit.workflowName || "workflow"}
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#71717A]">
                            no run
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        {commit.author} · {asDate(commit.committedAt)}
                      </p>
                    </div>
                  ))}
                  {!repo.commits.length && (
                    <p className="text-[11px] text-[#71717A]">
                      Aucun commit récupéré pour ce dépôt.
                    </p>
                  )}
                </div>
              </div>
            ))}
            {adminChangelog.isError && (
              <p className="text-sm text-[#FCA5A5]">
                Erreur changelog: {adminChangelog.error.message}
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
