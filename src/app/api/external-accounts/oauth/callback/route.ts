/**
 * Proxy for POST /api/external-accounts/oauth2/callback — exchange the
 * authorization code for tokens.
 * Backend: reimagined-guide src/bin/email_api_dir/external_handlers/oauth2.rs
 */
import { NextResponse } from "next/server";
import { buildForwardHeaders, resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch(
    `${resolveBackendBaseUrl()}/api/external-accounts/oauth2/callback`,
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
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
