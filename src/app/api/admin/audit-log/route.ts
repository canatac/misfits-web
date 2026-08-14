/**
 * Proxy for GET /api/admin/audit-log — introduced in backend PR4.
 * Optional query params: ?target=&actor=&action=&limit=
 */
import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backend(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const upstream = await fetch(
    `${backend()}/api/admin/audit-log?${url.searchParams.toString()}`,
    {
      method: "GET",
      headers: buildForwardHeaders(request),
      cache: "no-store",
    }
  );
  const text = await upstream.text().catch(() => "");
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
