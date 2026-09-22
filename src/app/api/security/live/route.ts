import { NextResponse } from "next/server";
import { resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let upstream: Response;
  try {
    upstream = await fetch(`${resolveBackendBaseUrl()}/api/security/live`, {
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
      { error: "Unable to reach security stream upstream." },
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
