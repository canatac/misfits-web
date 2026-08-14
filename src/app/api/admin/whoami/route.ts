/**
 * Proxy for GET /api/admin/whoami — introduced in backend PR1 (RBAC foundation).
 *
 * Returns the authenticated user's effective role and whether the RBAC
 * enforcement flag is active on the backend. Consumed by the admin console
 * to switch between "viewer" and full CRUD affordances without guessing
 * from a client-side role field.
 */

import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET(request: Request) {
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
}
