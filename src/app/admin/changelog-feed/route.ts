import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RepoDef = {
  key: "web" | "backend";
  owner: string;
  repo: string;
};

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

type WorkflowRun = {
  head_sha?: string;
  html_url?: string;
  name?: string;
};

type RepoPayload = {
  key: RepoDef["key"];
  owner: string;
  repo: string;
  latestShortSha: string;
  commits: CommitItem[];
};

type WorkflowRelease = {
  id: string;
  title: string;
  summary: string;
  releasedAt: string;
  sourceChangeRequestId: string;
  priority: "P0" | "P1" | "P2";
  scope: "ux" | "backend" | "fullstack" | "security";
  sourceType?: "change_request" | "pull_request";
  repository?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  author?: string;
};

type ChangeRequestsPayload = {
  items?: Array<{
    id: string;
    title: string;
    desiredOutcome: string;
    status: string;
    priority: "P0" | "P1" | "P2";
    scope: "ux" | "backend" | "fullstack" | "security";
    updatedAt?: string;
    changelogEntry?: {
      summary?: string;
      releasedAt?: string;
    };
  }>;
};

type PullRequestPayload = {
  number?: number;
  title?: string;
  body?: string | null;
  html_url?: string;
  merged_at?: string | null;
  merge_commit_sha?: string;
  user?: { login?: string };
};

const REPOS: RepoDef[] = [
  { key: "web", owner: "canatac", repo: "misfits-web" },
  { key: "backend", owner: "canatac", repo: "reimagined-guide" },
];

function firstLine(message: string | undefined): string {
  if (!message) return "(no message)";
  return message.split("\n")[0]?.trim() || "(no message)";
}

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function fetchWorkflowReleases(request: Request): Promise<WorkflowRelease[]> {
  const res = await fetch(
    `${resolveBackendBaseUrl()}/api/admin/change-requests`,
    {
      headers: buildForwardHeaders(request),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return [];
  }

  const payload = (await res.json().catch(() => ({}))) as ChangeRequestsPayload;
  const items = payload.items || [];

  return items
    .filter((item) => item.status === "released")
    .map((item) => ({
      id: `release_${item.id}`,
      title: item.title,
      summary: item.changelogEntry?.summary || item.desiredOutcome,
      releasedAt:
        item.changelogEntry?.releasedAt ||
        item.updatedAt ||
        new Date().toISOString(),
      sourceChangeRequestId: item.id,
      priority: item.priority,
      scope: item.scope,
      sourceType: "change_request" as const,
    }))
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}

async function githubGet(path: string): Promise<any> {
  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    "";

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "misfits-web-admin-changelog",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}

function buildScopeForRepo(repoKey: RepoDef["key"]): WorkflowRelease["scope"] {
  if (repoKey === "backend") return "backend";
  return "ux";
}

function buildPrSummary(pr: PullRequestPayload): string {
  const firstBodyLine = firstLine((pr.body || "").trim() || undefined);
  if (firstBodyLine !== "(no message)") return firstBodyLine;

  const mergeSha = pr.merge_commit_sha?.slice(0, 5);
  return mergeSha
    ? `PR mergée automatiquement (${mergeSha})`
    : "PR mergée automatiquement";
}

async function fetchMergedPrReleases(): Promise<WorkflowRelease[]> {
  const allReleases: WorkflowRelease[] = [];

  for (const repoDef of REPOS) {
    const pulls = (await githubGet(
      `/repos/${repoDef.owner}/${repoDef.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`
    )) as PullRequestPayload[];

    for (const pr of pulls) {
      if (!pr.merged_at || !pr.number || !pr.title || !pr.html_url) continue;

      const mergeSha = pr.merge_commit_sha || "";
      allReleases.push({
        id: `pr_${repoDef.repo}_${pr.number}`,
        title: `[${repoDef.repo}] #${pr.number} ${pr.title}`,
        summary: buildPrSummary(pr),
        releasedAt: pr.merged_at,
        sourceChangeRequestId: `PR #${pr.number}`,
        priority: "P1",
        scope: buildScopeForRepo(repoDef.key),
        sourceType: "pull_request" as const,
        repository: `${repoDef.owner}/${repoDef.repo}`,
        pullRequestNumber: pr.number,
        pullRequestUrl: pr.html_url,
        author: pr.user?.login || "unknown",
      });

      if (mergeSha) {
        allReleases.push({
          id: `merge_${repoDef.repo}_${mergeSha}`,
          title: `[${repoDef.repo}] merge ${mergeSha.slice(0, 5)}`,
          summary: `Commit de merge de la PR #${pr.number}`,
          releasedAt: pr.merged_at,
          sourceChangeRequestId: `PR #${pr.number}`,
          priority: "P1",
          scope: buildScopeForRepo(repoDef.key),
          sourceType: "pull_request" as const,
          repository: `${repoDef.owner}/${repoDef.repo}`,
          pullRequestNumber: pr.number,
          pullRequestUrl: pr.html_url,
          author: pr.user?.login || "unknown",
        });
      }
    }
  }

  const dedup = new Map<string, WorkflowRelease>();
  for (const item of allReleases) {
    if (!dedup.has(item.id)) dedup.set(item.id, item);
  }

  return [...dedup.values()]
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, 30);
}

async function fetchRepoChangelog(repoDef: RepoDef): Promise<RepoPayload> {
  const commits = (await githubGet(
    `/repos/${repoDef.owner}/${repoDef.repo}/commits?per_page=30`
  )) as any[];

  const runsData = await githubGet(
    `/repos/${repoDef.owner}/${repoDef.repo}/actions/runs?per_page=100`
  );
  const runs = (runsData?.workflow_runs || []) as WorkflowRun[];

  const runBySha = new Map<string, WorkflowRun>();
  for (const run of runs) {
    const sha = run.head_sha;
    if (!sha || runBySha.has(sha)) continue;
    runBySha.set(sha, run);
  }

  const items: CommitItem[] = commits.slice(0, 20).map((c) => {
    const sha = String(c.sha || "");
    const shortSha = sha.slice(0, 5);
    const author = c?.author?.login || c?.commit?.author?.name || "unknown";
    const committedAt = c?.commit?.author?.date || "";
    const message = firstLine(c?.commit?.message);
    const commitUrl =
      c?.html_url ||
      `https://github.com/${repoDef.owner}/${repoDef.repo}/commit/${sha}`;
    const workflow = runBySha.get(sha);

    return {
      sha,
      shortSha,
      author,
      committedAt,
      message,
      commitUrl,
      workflowUrl: workflow?.html_url || null,
      workflowName: workflow?.name || null,
    };
  });

  return {
    key: repoDef.key,
    owner: repoDef.owner,
    repo: repoDef.repo,
    latestShortSha: items[0]?.shortSha || "unknown",
    commits: items,
  };
}

export async function GET(request: Request) {
  try {
    const [repositories, workflowReleases, mergedPrReleases] = await Promise.all([
      Promise.all(REPOS.map(fetchRepoChangelog)),
      fetchWorkflowReleases(request),
      fetchMergedPrReleases(),
    ]);

    const unifiedReleases = [...workflowReleases, ...mergedPrReleases]
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
      .slice(0, 60);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        repositories,
        workflowReleases: unifiedReleases,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load changelog";
    return NextResponse.json(
      { error: { message } },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
