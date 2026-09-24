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
 * Issue: #780 (MW-2026-054), #866 (502 regression after PR#860 deploy),
 *         #1025 (10s+ hang — missing auth gate + no fast-fail on backend timeout)
 *
 * Retry logic: transient backend failures (container restart, network blip)
 * are retried with exponential backoff to avoid 502s during deploy windows.
 * Fetch timeout: AbortSignal.timeout(5000) ensures fast-fail instead of
 * indefinite hangs when the backend connection pool is exhausted.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders, resolveBackendBaseUrlCandidates } from "@/lib/proxy-auth";

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 200;
const FETCH_TIMEOUT_MS = 5000; // AbortSignal timeout — fail fast instead of hanging (issue #1025)

function buildBackendUrl(baseUrl: string, request: Request): string {
  const url = new URL(request.url);
  // /api/compose/send → ${BACKEND_URL}/api/send
  return `${baseUrl}/api/send${url.search}`;
}

async function fetchWithRetry(
  targetUrl: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(targetUrl, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      // Only retry on 5xx or network error, not 4xx client errors
      if (res.status < 500) return res;
      lastErr = new Error(`backend returned ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
    }
  }
  throw lastErr;
}

/** Try each backend candidate in order until one succeeds. */
async function fetchWithFallback(
  candidates: string[],
  init: RequestInit,
  request: Request
): Promise<Response> {
  let lastErr: unknown;
  for (const baseUrl of candidates) {
    const targetUrl = buildBackendUrl(baseUrl, request);
    try {
      const res = await fetchWithRetry(targetUrl, init, MAX_RETRIES);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function proxy(request: Request): Promise<Response> {
  const candidates = resolveBackendBaseUrlCandidates();
  const headers = buildForwardHeaders(request);

  // Forward Content-Type from the original request
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  try {
    const backendRes = await fetchWithFallback(candidates, {
      method: request.method,
      headers,
      body,
    }, request);

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
