/**
 * Proxy for POST /api/admin/users/{id}/reset-password — introduced in backend PR3.
 * Optional body: { newPassword?: string, revokeSessions?: boolean }.
 */
import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backend(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.trim()) {
    return NextResponse.json(
      { error: { message: "Missing id" } },
      { status: 400 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const headers = buildForwardHeaders(request);
  headers.set("Content-Type", "application/json");
  const upstream = await fetch(
    `${backend()}/api/admin/users/${encodeURIComponent(id)}/reset-password`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body ?? {}),
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
