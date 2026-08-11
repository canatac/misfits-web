import { NextResponse } from "next/server";
import {
  createChangeRequest,
  listChangeRequests,
  transitionChangeRequest,
} from "@/lib/admin-change-workflow";
import type {
  CreateChangeRequestInput,
  TransitionChangeRequestInput,
  WorkflowStatus,
} from "@/types/admin-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: WorkflowStatus[] = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
  "rejected",
];

function countsByStatus() {
  const base = Object.fromEntries(
    STATUSES.map((status) => [status, 0])
  ) as Record<WorkflowStatus, number>;

  for (const item of listChangeRequests()) {
    base[item.status] = (base[item.status] ?? 0) + 1;
  }

  return base;
}

function badRequest(message: string) {
  return NextResponse.json({ error: { message } }, { status: 400 });
}

function validateCreatePayload(
  payload: unknown
): CreateChangeRequestInput | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  const title = String(data.title ?? "").trim();
  const problem = String(data.problem ?? "").trim();
  const desiredOutcome = String(data.desiredOutcome ?? "").trim();
  const requestedBy = String(data.requestedBy ?? "").trim();

  const scope = data.scope;
  const urgency = data.urgency;
  const impact = data.impact;
  const linkedRepo = data.linkedRepo;

  if (title.length < 8 || problem.length < 16 || desiredOutcome.length < 16) {
    return null;
  }

  if (!["ux", "backend", "fullstack", "security"].includes(String(scope))) {
    return null;
  }

  if (!["low", "medium", "high"].includes(String(urgency))) {
    return null;
  }

  if (!["small", "medium", "high"].includes(String(impact))) {
    return null;
  }

  if (
    !["misfits-web", "reimagined-guide", "cross-repo"].includes(
      String(linkedRepo)
    )
  ) {
    return null;
  }

  return {
    title,
    problem,
    desiredOutcome,
    requestedBy: requestedBy || "unknown",
    scope: scope as CreateChangeRequestInput["scope"],
    urgency: urgency as CreateChangeRequestInput["urgency"],
    impact: impact as CreateChangeRequestInput["impact"],
    linkedRepo: linkedRepo as CreateChangeRequestInput["linkedRepo"],
  };
}

function validateTransitionPayload(
  payload: unknown
): TransitionChangeRequestInput | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const id = String(data.id ?? "").trim();
  const action = String(data.action ?? "").trim();
  const note = String(data.note ?? "").trim();

  if (!id || !["advance", "reject"].includes(action)) {
    return null;
  }

  return {
    id,
    action: action as TransitionChangeRequestInput["action"],
    note: note || undefined,
  };
}

export async function GET() {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      counts: countsByStatus(),
      items: listChangeRequests(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = validateCreatePayload(payload);

  if (!parsed) {
    return badRequest(
      "Invalid payload. Expected title/problem/desiredOutcome + scope/urgency/impact/linkedRepo."
    );
  }

  const item = createChangeRequest(parsed);

  return NextResponse.json(
    {
      item,
      counts: countsByStatus(),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = validateTransitionPayload(payload);

  if (!parsed) {
    return badRequest(
      "Invalid payload. Expected id + action=advance|reject (+ optional note)."
    );
  }

  const item = transitionChangeRequest(parsed.id, parsed.action, parsed.note);
  if (!item) {
    return NextResponse.json(
      { error: { message: "Change request not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      item,
      counts: countsByStatus(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
