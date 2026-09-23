import { NextResponse } from "next/server";
import { resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe — verifies the web container can reach the backend.
 *
 * Used by Docker healthcheck. If the backend is unreachable (DNS failure,
 * network partition, container restart), this endpoint returns 503 so
 * Docker marks the container unhealthy and restarts it (restart: unless-stopped).
 *
 * This prevents the persistent 502 condition seen in issue #866 where
 * the web container loses connectivity to email-api:8000 but keeps running.
 */
export async function GET() {
  try {
    const backendUrl = resolveBackendBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${backendUrl}/api/monitoring/mongo-health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { status: "unhealthy", reason: `backend returned ${res.status}` },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "healthy", backend: backendUrl });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        reason: err instanceof Error ? err.message : "backend unreachable",
      },
      { status: 503 }
    );
  }
}
