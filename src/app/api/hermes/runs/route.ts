import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HermesRunBody {
  input?: unknown;
  model?: string;
  threadId?: string;
  userId?: string | number;
  sessionId?: string;
  sessionKey?: string;
}

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

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]/g, "").trim().slice(0, 256);
}

function buildSessionHeaders(body: HermesRunBody): Record<string, string> {
  const rawSessionId =
    body.sessionId ||
    (body.threadId ? `mail-thread-${String(body.threadId)}` : undefined);
  const rawSessionKey =
    body.sessionKey ||
    (body.userId !== undefined ? `user-${String(body.userId)}` : undefined);

  const headers: Record<string, string> = {};

  if (rawSessionId) {
    headers["X-Hermes-Session-Id"] = sanitizeHeaderValue(rawSessionId);
  }

  if (rawSessionKey) {
    headers["X-Hermes-Session-Key"] = sanitizeHeaderValue(rawSessionKey);
  }

  return headers;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.HERMES_API_KEY;
  if (!apiKey) {
    return jsonError(
      "Hermes service is not configured (missing HERMES_API_KEY).",
      503,
    );
  }

  let body: HermesRunBody;
  try {
    body = (await req.json()) as HermesRunBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (body.input === undefined || body.input === null) {
    return jsonError("`input` is required.", 400);
  }

  const baseUrl = resolveHermesBaseUrl();

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...buildSessionHeaders(body),
      },
      body: JSON.stringify({
        input: body.input,
        model: body.model || "hermes-agent",
      }),
      cache: "no-store",
    });
  } catch {
    return jsonError("Unable to reach Hermes upstream.", 502);
  }

  const contentType = upstream.headers.get("content-type") || "application/json";
  const text = await upstream.text().catch(() => "");

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
