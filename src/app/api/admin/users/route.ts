import { NextResponse } from "next/server";
import { listAdminUsers, updateAdminUserRole } from "@/lib/admin-user-directory";
import type { UpdateAdminUserRoleInput } from "@/types/admin-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ error: { message } }, { status: 400 });
}

function validateRolePatchPayload(payload: unknown): UpdateAdminUserRoleInput | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const id = String(data.id ?? "").trim();
  const role = String(data.role ?? "").trim();

  if (!id || !["user", "admin", "support"].includes(role)) {
    return null;
  }

  return {
    id,
    role: role as UpdateAdminUserRoleInput["role"],
  };
}

export async function GET() {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      users: listAdminUsers(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = validateRolePatchPayload(payload);

  if (!parsed) {
    return badRequest("Invalid payload. Expected id + role(user|admin|support). ");
  }

  const user = updateAdminUserRole(parsed.id, parsed.role);
  if (!user) {
    return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
  }

  return NextResponse.json(
    {
      user,
      users: listAdminUsers(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
