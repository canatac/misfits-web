/**
 * Proxy for GET /api/admin/whoami — introduced in backend PR1 (RBAC foundation).
 *
 * Returns the authenticated user's effective role and whether the RBAC
 * enforcement flag is active on the backend. Consumed by the admin console
 * to switch between "viewer" and full CRUD affordances without guessing
 * from a client-side role field.
 */

import { NextResponse } from "next/server";
import { buildForwardHeaders, resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const upstream = await fetch(
      `${resolveBackendBaseUrl()}/api/admin/whoami`,
      {
        method: "GET",
        headers: buildForwardHeaders(request),
        cache: "no-store",
      }
    );

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text().catch(() => "");
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Backend unreachable — return 502 (not 500) with structured error.
    // Prevents the admin console from misinterpreting a 500 as an auth failure.
    return NextResponse.json(
      {
        code: "BACKEND_UNREACHABLE",
        message: "Unable to reach the backend whoami service",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
