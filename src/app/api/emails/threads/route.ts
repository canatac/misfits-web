/**
 * Conversation threads endpoint — groups emails by thread_key.
 *
 * GET /api/emails/threads
 *
 * Fetches the inbox from the Rust backend (/api/emails), groups messages by
 * their `thread_key`, and returns thread-grouped data for the conversation
 * view UI (issue #713, MW-2026-008).
 *
 * Response shape:
 * {
 *   threads: [
 *     {
 *       thread_key: string,
 *       subject: string,
 *       message_count: number,
 *       last_activity: string (ISO date),
 *       participants: string[],
 *       messages: [ { id, from, to, subject, sent_at, body_preview, flags } ]
 *     }
 *   ],
 *   total_threads: number,
 *   total_messages: number
 * }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildForwardHeaders } from "@/lib/proxy-auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://email-api:8000";

interface BackendEmail {
  id: string;
  account_id?: string;
  folder_id?: string;
  from: string;
  to: string;
  subject: string;
  sent_at: string;
  body_preview?: string;
  flags?: string[];
  thread_key?: string;
  message_id_header?: string;
  [key: string]: unknown;
}

interface Thread {
  thread_key: string;
  subject: string;
  message_count: number;
  last_activity: string;
  participants: string[];
  messages: BackendEmail[];
}

function normalizeSubject(subject: string): string {
  // Strip Re:/Fwd:/Fw: prefixes for thread grouping by topic
  return subject
    .replace(/^(Re|Fwd|Fw|RE|FWD|FW)\s*:\s*/gi, "")
    .trim();
}

function buildThreadKey(email: BackendEmail): string {
  // Prefer explicit thread_key from backend, fall back to Message-ID based grouping
  if (email.thread_key) return email.thread_key;
  if (email.message_id_header) return email.message_id_header;
  // Last resort: normalize subject + participants hash
  return `subject:${normalizeSubject(email.subject)}`;
}

function groupByThread(emails: BackendEmail[]): Thread[] {
  const threadMap = new Map<string, Thread>();

  for (const email of emails) {
    const key = buildThreadKey(email);

    if (!threadMap.has(key)) {
      threadMap.set(key, {
        thread_key: key,
        subject: normalizeSubject(email.subject) || "(no subject)",
        message_count: 0,
        last_activity: email.sent_at,
        participants: [],
        messages: [],
      });
    }

    const thread = threadMap.get(key)!;
    thread.messages.push(email);
    thread.message_count = thread.messages.length;

    // Track latest activity
    if (email.sent_at > thread.last_activity) {
      thread.last_activity = email.sent_at;
    }

    // Collect participants
    const participants = [email.from, ...email.to.split(",").map((s) => s.trim())];
    for (const p of participants) {
      if (p && !thread.participants.includes(p)) {
        thread.participants.push(p);
      }
    }
  }

  // Sort threads by most recent activity first
  const threads = Array.from(threadMap.values());
  threads.sort((a, b) => b.last_activity.localeCompare(a.last_activity));

  // Sort messages within each thread chronologically
  for (const thread of threads) {
    thread.messages.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
  }

  return threads;
}

export async function GET(request: Request): Promise<Response> {
  const headers = buildForwardHeaders(request);

  // Forward any query params (pagination, folder, etc.)
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/emails${url.search}`;

  try {
    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!backendRes.ok) {
      // Pass through backend errors
      const resHeaders = new Headers();
      backendRes.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower === "transfer-encoding" || lower === "connection" || lower === "keep-alive") return;
        resHeaders.set(key, value);
      });
      resHeaders.set("Cache-Control", "no-store");
      return new Response(backendRes.body, {
        status: backendRes.status,
        headers: resHeaders,
      });
    }

    const data = await backendRes.json();

    // Handle both array response and paginated { emails: [] } shape
    let emails: BackendEmail[];
    if (Array.isArray(data)) {
      emails = data;
    } else if (data && Array.isArray(data.emails)) {
      emails = data.emails;
    } else if (data && Array.isArray(data.items)) {
      emails = data.items;
    } else {
      emails = [];
    }

    const threads = groupByThread(emails);
    const totalMessages = emails.length;

    return new Response(
      JSON.stringify({
        threads,
        total_threads: threads.length,
        total_messages: totalMessages,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "backend_unavailable",
        message: String(err),
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
