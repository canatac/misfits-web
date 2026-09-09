import type { Session } from "@/types/auth";

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeSession(raw: Record<string, unknown>): Session {
  function deepMap(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(deepMap);
    if (isRecord(obj)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[toCamel(k)] = deepMap(v);
      }
      return out;
    }
    return obj;
  }

  return deepMap(raw) as Session;
}

export function isValidSession(value: unknown): value is Session {
  if (!isRecord(value)) return false;
  const user = value.user;
  if (!isRecord(user)) return false;

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0 &&
    isFiniteNumber(value.expiresAt) &&
    isFiniteNumber(value.refreshExpiresAt) &&
    isFiniteNumber(value.issuedAt) &&
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    user.email.length > 0 &&
    typeof user.role === "string" &&
    user.role.length > 0 &&
    typeof user.twoFactorEnabled === "boolean" &&
    typeof user.createdAt === "string" &&
    user.createdAt.length > 0 &&
    typeof user.updatedAt === "string" &&
    user.updatedAt.length > 0
  );
}

export function parseSession(raw: unknown): Session | null {
  if (!isRecord(raw)) return null;
  const normalized = normalizeSession(raw);
  return isValidSession(normalized) ? normalized : null;
}
