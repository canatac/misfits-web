/**
 * Read receipts proxy — GET/POST /api/mail/read-receipts.
 *
 * Proxies read-receipt operations to the Rust email-api backend
 * (/api/mail/read-receipts). This route exists so that Caddy sends
 * /api/mail* through Next.js (port 3001) where Edge middleware enforces
 * session auth BEFORE the proxy handler runs.
 *
 * Uses buildForwardHeaders() to forward Authorization + cookies from the
 * incoming request — consistent with /api/compose/send and /api/templates.
 *
 * Related: issue #820 (MW-2026-065: Email read receipts API 404)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders, resolveBackendBaseUrl } from "@/lib/proxy-auth";

const BACKEND_PATH = "/api/mail/read-receipts";

function buildBackendUrl(request: Request): string {
  const base = resolveBackendBaseUrl();
  const url = new URL(request.url);
  return `${base}${BACKEND_PATH}${url.search}`;
}

async function proxy(request: Request): Promise<Response> {
  const targetUrl = buildBackendUrl(request);
  const headers = buildForwardHeaders(request);

  // Forward Content-Type from the original request
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });
    const text = await res.text();
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/json");
    return new Response(text, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return Response.json(
      { error: "Backend unavailable" },
      { status: 502 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  return proxy(request);
}

export async function POST(request: Request): Promise<Response> {
  return proxy(request);
}
