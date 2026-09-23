/**
 * Email templates CRUD proxy — GET/POST/PUT/DELETE /api/templates.
 *
 * Proxies template operations to the Rust email-api backend
 * (/api/templates). This route exists so that Caddy sends /api/templates*
 * through Next.js (port 3001) where Edge middleware enforces session auth
 * BEFORE the proxy handler runs.
 *
 * Without this route, /api/templates falls through to the generic /api/*
 * Caddy handle which proxies directly to email-api:8000 — bypassing
 * Next.js auth middleware (issue #852).
 *
 * Issue: #852 (MW-2026-004), #857 (MW-2026-085)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders } from "@/lib/proxy-auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://email-api:8000";

function buildBackendUrl(request: Request): string {
  const url = new URL(request.url);
  // /api/templates → ${BACKEND_URL}/api/templates
  return `${BACKEND_URL}/api/templates${url.search}`;
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

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
