import { NextResponse } from "next/server";

const WEB_REPO = "canatac/misfits-web";

function normalizeLabel(value: string | undefined, fallback = "unknown"): string {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function extractCommitSha(label: string): string | null {
  const candidate = label.includes("@") ? label.split("@").at(-1) ?? "" : label;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith("sha256:")) return null;
  return /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : null;
}

export async function GET() {
  const webLabel = normalizeLabel(
    process.env.MISFITS_WEB_BUILD_VERSION ||
      process.env.NEXT_PUBLIC_MISFITS_WEB_BUILD_VERSION
  );

  const webCommitSha = extractCommitSha(webLabel);
  const webCommitUrl = webCommitSha
    ? `https://github.com/${WEB_REPO}/commit/${webCommitSha}`
    : null;

  return NextResponse.json(
    {
      web: {
        label: webLabel,
        commitSha: webCommitSha,
        commitUrl: webCommitUrl,
      },
      changelogUrl: "/admin/changelog",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
