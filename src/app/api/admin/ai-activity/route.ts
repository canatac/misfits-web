import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || "https://api.misfits.ai";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asObj(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  );
  return sorted[idx] || 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(10, toNumber(url.searchParams.get("limit") ?? 40, 40))
  );

  const upstream = await fetch(
    `${resolveBackendBaseUrl()}/api/hermes/runs?limit=${limit}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json(
      { error: { message: "Backend Hermes gateway unavailable" } },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return new NextResponse(
      text || '{"error":{"message":"Hermes runs unavailable"}}',
      {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const payload = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const list =
    (Array.isArray(payload.data) && payload.data) ||
    (Array.isArray(payload.runs) && payload.runs) ||
    (Array.isArray(payload.items) && payload.items) ||
    [];

  const runs = list.map((raw, index) => {
    const run = asObj(raw);
    const usage = asObj(run.usage);
    const status = toStringValue(run.status, "unknown");
    const startedAt =
      toStringValue(run.started_at) ||
      toStringValue(run.startedAt) ||
      toStringValue(run.created_at) ||
      toStringValue(run.createdAt);
    const completedAt =
      toStringValue(run.completed_at) || toStringValue(run.completedAt);

    const startMs = startedAt ? Date.parse(startedAt) : NaN;
    const endMs = completedAt ? Date.parse(completedAt) : NaN;
    const latencyMs =
      Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
        ? Math.round(endMs - startMs)
        : undefined;

    const promptTokens = toNumber(usage.prompt_tokens ?? usage.promptTokens, 0);
    const completionTokens = toNumber(
      usage.completion_tokens ?? usage.completionTokens,
      0
    );
    const totalTokens = toNumber(
      usage.total_tokens ?? usage.totalTokens,
      promptTokens + completionTokens
    );

    return {
      id: toStringValue(run.id, `run_${index}`),
      status,
      model: toStringValue(run.model, "hermes-agent"),
      startedAt: startedAt || undefined,
      completedAt: completedAt || undefined,
      latencyMs,
      promptTokens,
      completionTokens,
      totalTokens,
      sessionId:
        toStringValue(run.session_id) ||
        toStringValue(run.sessionId) ||
        undefined,
      userId:
        toStringValue(run.user_id) || toStringValue(run.userId) || undefined,
      error:
        toStringValue(run.last_error) ||
        toStringValue(asObj(run.error).message) ||
        undefined,
    };
  });

  const completedRuns = runs.filter((r) => r.status === "completed").length;
  const failedRuns = runs.filter((r) =>
    ["failed", "error", "cancelled", "expired"].includes(r.status)
  ).length;
  const totalRuns = runs.length;

  const latencyValues = runs
    .map((r) => r.latencyMs)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const promptTokens = runs.reduce((sum, r) => sum + r.promptTokens, 0);
  const completionTokens = runs.reduce((sum, r) => sum + r.completionTokens, 0);
  const totalTokens = runs.reduce((sum, r) => sum + r.totalTokens, 0);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      limit,
      metrics: {
        totalRuns,
        completedRuns,
        failedRuns,
        successRate: totalRuns > 0 ? completedRuns / totalRuns : 0,
        avgLatencyMs: latencyValues.length
          ? Math.round(
              latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length
            )
          : 0,
        p95LatencyMs: p95(latencyValues),
        promptTokens,
        completionTokens,
        totalTokens,
        avgTokensPerRun:
          totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0,
      },
      runs,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
