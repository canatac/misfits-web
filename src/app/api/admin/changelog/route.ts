import { NextResponse } from "next/server";

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

const REPOS: RepoDef[] = [
  { key: "web", owner: "canatac", repo: "misfits-web" },
  { key: "backend", owner: "canatac", repo: "reimagined-guide" },
];

function firstLine(message: string | undefined): string {
  if (!message) return "(no message)";
  return message.split("\n")[0]?.trim() || "(no message)";
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

async function fetchRepoChangelog(repoDef: RepoDef): Promise<RepoPayload> {
  const commits = (await githubGet(
    `/repos/${repoDef.owner}/${repoDef.repo}/commits?per_page=30`,
  )) as any[];

  const runsData = await githubGet(
    `/repos/${repoDef.owner}/${repoDef.repo}/actions/runs?per_page=100`,
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
    const shortSha = sha.slice(0, 8);
    const author =
      c?.author?.login || c?.commit?.author?.name || "unknown";
    const committedAt = c?.commit?.author?.date || "";
    const message = firstLine(c?.commit?.message);
    const commitUrl = c?.html_url || `https://github.com/${repoDef.owner}/${repoDef.repo}/commit/${sha}`;
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

export async function GET() {
  try {
    const repositories = await Promise.all(REPOS.map(fetchRepoChangelog));
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        repositories,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load changelog";
    return NextResponse.json(
      { error: { message } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
