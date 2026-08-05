import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "system" | "user" | "assistant" | "tool";

interface ChatMessage {
  role: ChatRole;
  content: unknown;
  name?: string;
  tool_call_id?: string;
}

interface HermesChatBody {
  messages?: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
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

function resolveBackendGatewayBaseUrl() {
  const raw = process.env.HERMES_GATEWAY_BASE_URL || process.env.BACKEND_URL;
  if (!raw) return null;
  return trimTrailingSlash(raw);
}

function shouldUseBackendGateway() {
  const mode = process.env.HERMES_PROXY_MODE?.toLowerCase();
  if (mode === "backend") return true;
  return Boolean(process.env.HERMES_GATEWAY_BASE_URL);
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]/g, "").trim().slice(0, 256);
}

function buildSessionHeaders(body: HermesChatBody): Record<string, string> {
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
  let body: HermesChatBody;
  try {
    body = (await req.json()) as HermesChatBody;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("`messages` is required and must be a non-empty array.", 400);
  }

  if (shouldUseBackendGateway()) {
    const backendBase = resolveBackendGatewayBaseUrl();
    if (!backendBase) {
      return jsonError(
        "Backend Hermes gateway mode is enabled but BACKEND_URL/HERMES_GATEWAY_BASE_URL is missing.",
        503,
      );
    }

    const upstreamPayload = {
      model: body.model || "hermes-agent",
      messages: body.messages,
      stream: Boolean(body.stream),
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      threadId: body.threadId,
      userId: body.userId,
    };

    let upstream: Response;
    try {
      upstream = await fetch(`${backendBase}/api/hermes/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(upstreamPayload),
        cache: "no-store",
      });
    } catch {
      return jsonError("Unable to reach backend Hermes gateway.", 502);
    }

    const contentType =
      upstream.headers.get("content-type") || "application/json";
    if (!upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new NextResponse(text || "Backend Hermes gateway error.", {
        status: upstream.status || 502,
        headers: { "Content-Type": contentType },
      });
    }

    return new NextResponse(upstream.body, {
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

  const upstreamPayload = {
    model: body.model || "hermes-agent",
    messages: body.messages,
    stream: Boolean(body.stream),
    temperature: body.temperature,
    max_tokens: body.max_tokens,
  };

  const upstreamUrl = `${resolveHermesBaseUrl()}/chat/completions`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...buildSessionHeaders(body),
      },
      body: JSON.stringify(upstreamPayload),
      cache: "no-store",
    });
  } catch {
    return jsonError("Unable to reach Hermes upstream.", 502);
  }

  const contentType = upstream.headers.get("content-type") || "application/json";

  if (!upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new NextResponse(text || "Hermes upstream error.", {
      status: upstream.status || 502,
      headers: { "Content-Type": contentType },
    });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
