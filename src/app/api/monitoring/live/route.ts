import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveMonitoringBaseUrl(): string {
  const raw =
    process.env.MONITORING_API_BASE ||
    process.env.BACKEND_URL ||
    "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const messageId = params.get("message_id")?.trim();

  const upstreamUrl = new URL(
    `${resolveMonitoringBaseUrl()}/api/monitoring/live`
  );
  if (messageId) upstreamUrl.searchParams.set("message_id", messageId);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach monitoring stream upstream." },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "Upstream SSE error");
    return new NextResponse(errorText || "Upstream SSE error", {
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
