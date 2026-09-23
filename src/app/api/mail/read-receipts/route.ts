import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/mail/read-receipts — list read receipts for authenticated user
 * POST /api/mail/read-receipts — toggle read receipt setting
 * Proxies to Rust backend with session auth enforcement via Edge middleware.
 * Related: issue #820 (MW-2026-065: Email read receipts API 404)
 */

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/mail/read-receipts`, {
      headers: {
        'Authorization': `Bearer ${session.user?.email || ''}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/mail/read-receipts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.user?.email || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
