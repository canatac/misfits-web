import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveHermesBaseUrl() {
  return trimTrailingSlash(
    process.env.HERMES_BASE_URL || "http://127.0.0.1:8642/v1",
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) {
    return jsonError(
      "Hermes service is not configured (missing HERMES_API_KEY).",
      503,
    );
  }

  const { runId } = await params;
  if (!runId?.trim()) {
    return jsonError("Missing runId.", 400);
  }

  const baseUrl = resolveHermesBaseUrl();
  const query = req.nextUrl.searchParams.toString();
  const url = `${baseUrl}/runs/${encodeURIComponent(runId)}/events${query ? `?${query}` : ""}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      cache: "no-store",
    });
  } catch {
    return jsonError("Unable to reach Hermes event stream upstream.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "Hermes event stream error");
    return new NextResponse(errorText || "Hermes event stream error", {
      status: upstream.status || 502,
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
