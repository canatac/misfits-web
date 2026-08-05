import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveHermesBaseUrl() {
  return trimTrailingSlash(
    process.env.HERMES_BASE_URL || "http://127.0.0.1:8642/v1",
  );
}

function resolveBackendGatewayBaseUrl() {
  const raw = process.env.HERMES_GATEWAY_BASE_URL || process.env.BACKEND_URL;
  if (!raw) return null;
  return trimTrailingSlash(raw);
}

function shouldUseBackendGateway() {
  const mode = process.env.HERMES_PROXY_MODE?.toLowerCase();
  if (mode === "backend") return true;
  if (mode === "direct") return false;
  return Boolean(process.env.HERMES_GATEWAY_BASE_URL || process.env.BACKEND_URL);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  if (!runId?.trim()) {
    return jsonError("Missing runId.", 400);
  }

  if (shouldUseBackendGateway()) {
    const backendBase = resolveBackendGatewayBaseUrl();
    if (!backendBase) {
      return jsonError(
        "Backend Hermes gateway mode is enabled but BACKEND_URL/HERMES_GATEWAY_BASE_URL is missing.",
        503,
      );
    }

    let upstream: Response;
    try {
      upstream = await fetch(
        `${backendBase}/api/hermes/runs/${encodeURIComponent(runId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
    } catch {
      return jsonError("Unable to reach backend Hermes gateway.", 502);
    }

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text().catch(() => "");

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  }

  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) {
    return jsonError(
      "Hermes service is not configured (missing HERMES_API_KEY).",
      503,
    );
  }

  const baseUrl = resolveHermesBaseUrl();

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/runs/${encodeURIComponent(runId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
  } catch {
    return jsonError("Unable to reach Hermes upstream.", 502);
  }

  const contentType =
    upstream.headers.get("content-type") || "application/json";
  const text = await upstream.text().catch(() => "");

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
