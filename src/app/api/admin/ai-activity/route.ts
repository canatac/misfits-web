import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function toNumber(value: string | null, fallback: number): number {
  const n = Number(value ?? "");
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(10, toNumber(url.searchParams.get("limit"), 100)));

  const upstream = await fetch(
    `${resolveBackendBaseUrl()}/api/admin/ai-activity?limit=${limit}`,
    {
      method: "GET",
      headers: buildForwardHeaders(request),
      cache: "no-store",
    }
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { error: { message: "Backend admin ai-activity unavailable" } },
      { status: 502 }
    );
  }

  const text = await upstream.text().catch(() => "");
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
