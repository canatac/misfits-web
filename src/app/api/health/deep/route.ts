import { NextResponse } from "next/server";
import { resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEEP_TIMEOUT_MS = 5000;

/**
 * Deep health check — verifies backend AND MongoDB are healthy.
 *
 * Probes the backend's /api/monitoring/mongo-health endpoint to confirm
 * the full stack (web → backend → MongoDB) is operational.
 *
 * Used by monitoring/alerting. NOT used by Docker healthcheck (that uses
 * the lightweight /api/health to avoid restart loops during transient
 * MongoDB slowness — issue #999, MW-2026-101).
 *
 * Returns:
 *   200 — backend reachable AND MongoDB ping < 100ms
 *   503 — backend unreachable OR MongoDB unhealthy (with reason)
 */
export async function GET() {
  try {
    const backendUrl = resolveBackendBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEEP_TIMEOUT_MS);

    const res = await fetch(`${backendUrl}/api/monitoring/mongo-health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        {
          status: "unhealthy",
          component: "mongodb",
          reason: `backend mongo-health returned ${res.status}`,
          detail: body.slice(0, 200),
        },
        { status: 503 }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      status: "healthy",
      component: "mongodb",
      backend: backendUrl,
      ...data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        component: "backend",
        reason: err instanceof Error ? err.message : "backend unreachable",
      },
      { status: 503 }
    );
  }
}
