import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function proxy(
  id: string,
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown
) {
  try {
    const upstream = await fetch(
      `${resolveBackendBaseUrl()}/api/admin/change-requests/${encodeURIComponent(id)}`,
      {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      }
    );

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
  } catch {
    return NextResponse.json(
      { error: { message: "Backend admin change-requests unavailable" } },
      { status: 502 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      { error: { message: "Missing change request id" } },
      { status: 400 }
    );
  }
  return proxy(id.trim(), "GET");
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      { error: { message: "Missing change request id" } },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: { message: "Invalid payload" } },
      { status: 400 }
    );
  }

  return proxy(id.trim(), "PATCH", payload);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json(
      { error: { message: "Missing change request id" } },
      { status: 400 }
    );
  }
  return proxy(id.trim(), "DELETE");
}
