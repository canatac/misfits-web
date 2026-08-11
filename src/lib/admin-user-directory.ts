import type { AdminUserRecord } from "@/types/admin-ops";

const STORE_KEY = Symbol.for("misfits.admin.userDirectoryStore");

type GlobalStore = {
  users: AdminUserRecord[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function seedUsers(): AdminUserRecord[] {
  return [
    {
      id: "u_admin_root",
      email: "admin@misfits.ai",
      displayName: "Root Admin",
      role: "admin",
      status: "active",
      twoFactorEnabled: true,
      lastLoginAt: minutesAgo(14),
      lastActivityAt: minutesAgo(2),
      sessions24h: 11,
      actions7d: 37,
      changeRequests30d: 9,
      recentActivity: [
        { at: minutesAgo(2), label: "Validation CR-ops-monitoring", kind: "admin_action" },
        { at: hoursAgo(3), label: "Role update support -> admin", kind: "role_change" },
        { at: hoursAgo(9), label: "Login console admin", kind: "login" },
      ],
    },
    {
      id: "u_support_nora",
      email: "nora@misfits.ai",
      displayName: "Nora Support",
      role: "support",
      status: "active",
      twoFactorEnabled: true,
      lastLoginAt: hoursAgo(5),
      lastActivityAt: hoursAgo(1),
      sessions24h: 4,
      actions7d: 15,
      changeRequests30d: 2,
      recentActivity: [
        { at: hoursAgo(1), label: "Escalade incident SMTP", kind: "admin_action" },
        { at: hoursAgo(6), label: "Login support dashboard", kind: "login" },
      ],
    },
    {
      id: "u_pm_mina",
      email: "mina@misfits.ai",
      displayName: "Mina Product",
      role: "user",
      status: "active",
      twoFactorEnabled: false,
      lastLoginAt: daysAgo(1),
      lastActivityAt: hoursAgo(12),
      sessions24h: 2,
      actions7d: 7,
      changeRequests30d: 5,
      recentActivity: [
        { at: hoursAgo(12), label: "Ouverture change request UX inbox", kind: "change_request" },
        { at: daysAgo(1), label: "Login web app", kind: "login" },
      ],
    },
    {
      id: "u_ext_vendor",
      email: "vendor.integration@misfits.ai",
      displayName: "Vendor Integration",
      role: "user",
      status: "restricted",
      twoFactorEnabled: true,
      lastLoginAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
      sessions24h: 0,
      actions7d: 0,
      changeRequests30d: 0,
      recentActivity: [
        { at: daysAgo(8), label: "Accès restreint suite audit", kind: "admin_action" },
      ],
    },
  ];
}

function getStore(): GlobalStore {
  const globalRef = globalThis as typeof globalThis & { [STORE_KEY]?: GlobalStore };
  if (!globalRef[STORE_KEY]) {
    globalRef[STORE_KEY] = { users: seedUsers() };
  }
  return globalRef[STORE_KEY]!;
}

function byActivityDesc(a: AdminUserRecord, b: AdminUserRecord): number {
  return (b.lastActivityAt || "").localeCompare(a.lastActivityAt || "");
}

export function listAdminUsers(): AdminUserRecord[] {
  return [...getStore().users].sort(byActivityDesc);
}

export function updateAdminUserRole(
  id: string,
  role: AdminUserRecord["role"],
): AdminUserRecord | null {
  const store = getStore();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const user = store.users[index]!;
  if (user.role === role) return user;

  const activityEntry: AdminUserRecord["recentActivity"][number] = {
    at: nowIso(),
    label: `Role changed to ${role}`,
    kind: "role_change",
  };

  const updated: AdminUserRecord = {
    ...user,
    role,
    lastActivityAt: activityEntry.at,
    actions7d: user.actions7d + 1,
    recentActivity: [activityEntry, ...user.recentActivity].slice(0, 8),
  };

  store.users[index] = updated;
  return updated;
}
