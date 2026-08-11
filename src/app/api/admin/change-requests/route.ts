import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function proxy(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown
) {
  const upstream = await fetch(`${resolveBackendBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (id) {
    return proxy(`/api/admin/change-requests/${encodeURIComponent(id)}`, "GET");
  }
  return proxy("/api/admin/change-requests", "GET");
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: { message: "Invalid payload" } },
      { status: 400 }
    );
  }
  return proxy("/api/admin/change-requests", "POST", payload);
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: { message: "Invalid payload" } },
      { status: 400 }
    );
  }

  const data = payload as Record<string, unknown>;
  const id = String(data.id ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { error: { message: "Invalid payload. Expected id." } },
      { status: 400 }
    );
  }

  const patchBody: Record<string, unknown> = {};
  for (const key of [
    "action",
    "note",
    "title",
    "problem",
    "desiredOutcome",
    "status",
  ]) {
    if (data[key] !== undefined) patchBody[key] = data[key];
  }

  return proxy(
    `/api/admin/change-requests/${encodeURIComponent(id)}`,
    "PATCH",
    patchBody
  );
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { error: { message: "Missing id query parameter" } },
      { status: 400 }
    );
  }
  return proxy(`/api/admin/change-requests/${encodeURIComponent(id)}`, "DELETE");
}
