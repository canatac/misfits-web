/**
 * SSE proxy for POST /api/external-accounts/probe-stream.
 *
 * The backend streams IMAP request/response frames as text/event-stream.
 * We forward the upstream body straight through so the browser's
 * EventSource / fetch-reader sees each frame as it arrives.
 */
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backend(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch(
    `${backend()}/api/external-accounts/probe-stream`,
    {
      method: "POST",
      headers: {
        ...buildForwardHeaders(request),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body,
      cache: "no-store",
    }
  );

  // Pass the SSE body through unchanged. Next.js on Node.js supports
  // streaming responses when we hand back the upstream ReadableStream.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
