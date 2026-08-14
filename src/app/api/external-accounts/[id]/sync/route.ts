/**
 * Proxy for POST /api/external-accounts/{id}/sync — start an IMAP sync run.
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
  const body = await request.text();
  const upstream = await fetch(
    `${backend()}/api/external-accounts/${encodeURIComponent(id)}/sync`,
    {
      method: "POST",
      headers: {
        ...buildForwardHeaders(request),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    }
  );
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
