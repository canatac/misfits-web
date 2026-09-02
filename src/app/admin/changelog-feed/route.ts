import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPOS = [
  { key: "frontend", owner: "canatac", repo: "misfits-web", displayName: "misfits-web", scope: "frontend" },
  { key: "backend", owner: "canatac", repo: "reimagined-guide", displayName: "reimagined-guide", scope: "backend" },
] as const;

type Scope = "backend" | "frontend" | "infra" | "fullstack";
type Priority = "P0" | "P1" | "P2" | "P3";
type SourceType = "change_request" | "pull_request";

type RepoChangelog = {
  key: (typeof REPOS)[number]["key"];
  displayName: string;
  owner: string;
  repo: string;
  commits: Array<{
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
    commitUrl: string;
  }>;
};

type WorkflowRelease = {
  id: string;
  title: string;
  summary: string;
  releasedAt: string;
  sourceChangeRequestId: string;
  priority: Priority;
  scope: Scope;
  sourceType: SourceType;
  repository?: string;
  prNumber?: number;
  prUrl?: string;
  author?: string;
};

type ChangeRequestPayload = {
  items?: Array<{
    id: string;
    title: string;
    desiredOutcome?: string;
    priority?: Priority;
    status?: string;
    updatedAt?: string;
    changelogEntry?: {
      summary?: string;
      releasedAt?: string;
      commitSha?: string;
    };
  }>;
};

function resolveBackendBaseUrl(): string {
  return (
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    "https://mail.misfits.ai"
  ).replace(/\/$/, "");
}

function shortSha5(sha: string | undefined): string {
  if (!sha) return "unknown";
  return sha.slice(0, 5);
}

async function githubGet(path: string): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub ${path} -> ${res.status}`);
  }

  return res.json();
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "misfits-web-changelog-feed",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTML ${url} -> ${res.status}`);
  return res.text();
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

async function scrapeRepoCommits(repo: (typeof REPOS)[number]): Promise<RepoChangelog["commits"]> {
  const html = await fetchHtml(`https://github.com/${repo.owner}/${repo.repo}/commits/master`);
  const shaMatches = uniq(Array.from(html.matchAll(new RegExp(`/${repo.owner}/${repo.repo}/commit/([0-9a-f]{7,40})`, "g"))).map((m) => m[1])).slice(0, 10);
  return shaMatches.map((sha) => ({
    sha,
    shortSha: shortSha5(sha),
    message: "Commit",
    author: "unknown",
    date: new Date().toISOString(),
    commitUrl: `https://github.com/${repo.owner}/${repo.repo}/commit/${sha}`,
  }));
}

async function fetchRepoCommits(repo: (typeof REPOS)[number]): Promise<RepoChangelog["commits"]> {
  try {
    const commits = await githubGet(`/repos/${repo.owner}/${repo.repo}/commits?per_page=10`);
    return (Array.isArray(commits) ? commits : []).map((c: any) => ({
      sha: c.sha,
      shortSha: shortSha5(c.sha),
      message: c.commit?.message?.split("\n")[0] || "No message",
      author: c.commit?.author?.name || c.author?.login || "unknown",
      date: c.commit?.author?.date || new Date().toISOString(),
      commitUrl: c.html_url || `https://github.com/${repo.owner}/${repo.repo}/commit/${c.sha}`,
    }));
  } catch {
    return scrapeRepoCommits(repo);
  }
}

async function scrapeMergedPrReleases(repo: (typeof REPOS)[number]): Promise<WorkflowRelease[]> {
  const html = await fetchHtml(`https://github.com/${repo.owner}/${repo.repo}/pulls?q=is%3Apr+is%3Amerged`);
  const numbers = uniq(Array.from(html.matchAll(new RegExp(`/${repo.owner}/${repo.repo}/pull/(\\d+)`, "g"))).map((m) => Number(m[1]))).slice(0, 20);
  const now = new Date().toISOString();
  return numbers.map((n) => ({
    id: `pr_${repo.repo}_${n}`,
    title: `[${repo.displayName}] #${n}`,
    summary: "Merged pull request",
    releasedAt: now,
    sourceChangeRequestId: `PR #${n}`,
    priority: "P1",
    scope: repo.scope as Scope,
    sourceType: "pull_request",
    repository: `${repo.owner}/${repo.repo}`,
    prNumber: n,
    prUrl: `https://github.com/${repo.owner}/${repo.repo}/pull/${n}`,
    author: "unknown",
  }));
}

async function fetchMergedPrReleases(repo: (typeof REPOS)[number]): Promise<WorkflowRelease[]> {
  try {
    const pulls = await githubGet(`/repos/${repo.owner}/${repo.repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`);
    return (Array.isArray(pulls) ? pulls : [])
      .filter((pr: any) => Boolean(pr.merged_at))
      .slice(0, 20)
      .map((pr: any) => ({
        id: `pr_${repo.repo}_${pr.number}`,
        title: `[${repo.displayName}] #${pr.number} ${pr.title}`,
        summary: (pr.body || "Merged pull request").split("\n")[0].slice(0, 220),
        releasedAt: pr.merged_at,
        sourceChangeRequestId: `PR #${pr.number}`,
        priority: "P1" as const,
        scope: repo.scope as Scope,
        sourceType: "pull_request" as const,
        repository: `${repo.owner}/${repo.repo}`,
        prNumber: pr.number,
        prUrl: pr.html_url,
        author: pr.user?.login || "unknown",
      }));
  } catch {
    return scrapeMergedPrReleases(repo);
  }
}

async function fetchWorkflowReleases(request: Request): Promise<WorkflowRelease[]> {
  try {
    const res = await fetch(`${resolveBackendBaseUrl()}/api/admin/change-requests`, {
      headers: buildForwardHeaders(request),
      cache: "no-store",
    });
    if (!res.ok) return [];

    const payload = (await res.json().catch(() => ({}))) as ChangeRequestPayload;
    const items = payload.items || [];

    return items
      .filter((it) => it.status === "released")
      .map((it) => ({
        id: `release_${it.id}`,
        title: it.title,
        summary: it.changelogEntry?.summary || it.desiredOutcome || "Released",
        releasedAt: it.changelogEntry?.releasedAt || it.updatedAt || new Date().toISOString(),
        sourceChangeRequestId: `CR-${it.id.slice(0, 8)}`,
        priority: it.priority || "P2",
        scope: "fullstack" as const,
        sourceType: "change_request" as const,
      }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const repositories: RepoChangelog[] = [];
  const mergedPrReleases: WorkflowRelease[] = [];

  for (const repo of REPOS) {
    const [commits, prs] = await Promise.all([
      fetchRepoCommits(repo),
      fetchMergedPrReleases(repo),
    ]);
    repositories.push({
      key: repo.key,
      displayName: repo.displayName,
      owner: repo.owner,
      repo: repo.repo,
      commits,
    });
    mergedPrReleases.push(...prs);
  }

  const workflowReleases = await fetchWorkflowReleases(request);
  const unifiedReleases = [...workflowReleases, ...mergedPrReleases]
    .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
    .slice(0, 60);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      repositories,
      workflowReleases: unifiedReleases,
      warnings: [],
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
