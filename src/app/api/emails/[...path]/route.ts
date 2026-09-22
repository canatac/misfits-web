/**
 * Catch-all proxy for /api/emails/* — forwards to the Rust email-api backend.
 *
 * This route exists so that Caddy sends /api/emails/* through Next.js (port 3000)
 * instead of directly to the backend (port 8000). The Edge middleware enforces
 * session auth BEFORE this handler runs, fixing the auth bypass (issue #723, #722).
 *
 * Without this, Caddy routes /api/* directly to email-api:8000, completely
 * bypassing Next.js middleware — making all auth enforcement dead code.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders } from "@/lib/proxy-auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://email-api:8000";

function buildBackendUrl(request: Request): string {
  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/emails/, "");
  return `${BACKEND_URL}/api/emails${subPath}${url.search}`;
}

async function proxy(request: Request): Promise<Response> {
  const targetUrl = buildBackendUrl(request);
  const headers = buildForwardHeaders(request);

  // Forward body for non-GET/HEAD
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    // Stream the backend response back, stripping hop-by-hop headers
    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "keep-alive"
      )
        return;
      resHeaders.set(key, value);
    });
    // Never cache authenticated responses
    resHeaders.set("Cache-Control", "no-store");

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "backend_unavailable", message: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
