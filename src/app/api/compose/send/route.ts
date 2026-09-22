/**
 * Compose send proxy — POST /api/compose/send.
 *
 * Proxies the frontend "send email" action to the Rust email-api backend
 * (/api/send). This route exists so that Caddy sends /api/compose/* through
 * Next.js (port 3000) where Edge middleware enforces session auth BEFORE
 * the proxy handler runs.
 *
 * Without this route, POST /api/compose/send falls through to the generic
 * /api/* Caddy handle which proxies directly to email-api:8000 — bypassing
 * Next.js auth middleware (the same class of bug as issue #723/#722).
 *
 * Issue: #780 (MW-2026-054)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders } from "@/lib/proxy-auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://email-api:8000";

function buildBackendUrl(request: Request): string {
  const url = new URL(request.url);
  // /api/compose/send → ${BACKEND_URL}/api/send
  return `${BACKEND_URL}/api/send${url.search}`;
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
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

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

export const POST = proxy;
export const GET = proxy;
