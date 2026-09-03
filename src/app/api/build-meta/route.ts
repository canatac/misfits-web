import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractCommitSha(label: string): string | null {
  const candidate = label.includes("@") ? label.split("@").at(-1) ?? "" : label;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("sha256:")) return null;
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : null;
}

function resolveRepoLabel(repo: string, candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (!value) continue;
    const sha = extractCommitSha(value);
    if (sha) return `${repo}@${sha}`;
  }

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }

  return `${repo}@unknown`;
}

async function fetchLatestCommitSha(
  owner: string,
  repo: string,
  branch = "master"
): Promise<string | null> {
  const token =
    process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || "";

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "misfits-web-build-meta",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
      {
        headers,
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => null)) as { sha?: string } | null;
    const sha = String(payload?.sha || "").trim();
    return /^[0-9a-f]{7,40}$/i.test(sha) ? sha : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const webLabelFromEnv = resolveRepoLabel("misfits-web", [
    process.env.MISFITS_WEB_IMAGE_TAG,
    process.env.MISFITS_WEB_BUILD_VERSION,
    process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION,
  ]);

  const webLabel =
    webLabelFromEnv && extractCommitSha(webLabelFromEnv)
      ? webLabelFromEnv
      : `misfits-web@${
          (await fetchLatestCommitSha("canatac", "misfits-web", "master")) ||
          "unknown"
        }`;

  const backendLabel = resolveRepoLabel("reimagined-guide", [
    process.env.REIMAGINED_GUIDE_BUILD_VERSION,
    process.env.NEXT_PUBLIC_REIMAGINED_GUIDE_BUILD_VERSION,
  ]);

  return NextResponse.json(
    {
      webLabel,
      backendLabel,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
