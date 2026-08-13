import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function proxy(
  path: string,
  method: "GET" | "POST",
  body?: unknown
): Promise<NextResponse> {
  const upstream = await fetch(`${resolveBackendBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = url.searchParams.get("window") || "1h";
  return proxy(
    `/api/admin/deliverability/procedure?window=${encodeURIComponent(window)}`,
    "GET"
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: { message: "Invalid payload" } },
      { status: 400 }
    );
  }
  return proxy(`/api/admin/deliverability/procedure`, "POST", payload);
}
