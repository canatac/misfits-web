/**
 * Proxy for /api/mail/read-receipts — email read receipt management.
 * Backend: reimagined-guide (Rust/Actix).
 *
 * GET  /api/mail/read-receipts          — list read receipts for user
 * POST /api/mail/read-receipts          — request read receipt for a sent email
 *
 * Related: issue #820 (MW-2026-065), issue #817 (PO feature ticket)
 */
import { NextResponse } from "next/server";
import { buildForwardHeaders } from "@/lib/proxy-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backend(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET(request: Request) {
  const upstream = await fetch(`${backend()}/api/mail/read-receipts`, {
    method: "GET",
    headers: buildForwardHeaders(request),
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch(`${backend()}/api/mail/read-receipts`, {
    method: "POST",
    headers: {
      ...buildForwardHeaders(request),
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
