import { NextResponse } from "next/server";
import { resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVENESS_TIMEOUT_MS = 2000;
const DEEP_TIMEOUT_MS = 5000;

/**
 * Lightweight liveness probe — verifies the backend process is reachable.
 *
 * Used by Docker healthcheck. Only checks that the backend HTTP server
 * responds, NOT that MongoDB is connected. This prevents container restart
 * loops when MongoDB is temporarily slow (issue #999, MW-2026-101).
 *
 * For full MongoDB connectivity check, use GET /api/health/deep.
 */
export async function GET() {
  try {
    const backendUrl = resolveBackendBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LIVENESS_TIMEOUT_MS);

    // Lightweight: just hit the backend root — any HTTP response means alive
    const res = await fetch(`${backendUrl}/`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return NextResponse.json({
      status: "healthy",
      backend: backendUrl,
      backend_status: res.status,
    });
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
