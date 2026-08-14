/**
 * Proxy for POST /api/admin/users/{id}/invite — introduced in backend PR3.
 * Body is empty; the backend triggers the invite email through dkim-service.
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
  const upstream = await fetch(
    `${backend()}/api/admin/users/${encodeURIComponent(id)}/invite`,
    {
      method: "POST",
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
