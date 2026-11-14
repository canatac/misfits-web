/**
 * Proxy for GET /api/external-accounts/oauth2/providers — OAuth2 provider
 * catalogue for the add-account picker.
 * Backend: reimagined-guide src/bin/email_api_dir/external_handlers/oauth2.rs
 */
import { NextResponse } from "next/server";
import { buildForwardHeaders, resolveBackendBaseUrl } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const upstream = await fetch(
    `${resolveBackendBaseUrl()}/api/external-accounts/oauth2/providers`,
    {
      method: "GET",
      headers: buildForwardHeaders(request),
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
