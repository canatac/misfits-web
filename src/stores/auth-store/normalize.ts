import type { Session } from "@/types/auth";

function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function normalizeSession(raw: Record<string, unknown>): Session {
  function deepMap(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(deepMap);
    if (obj !== null && typeof obj === "object") {
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
