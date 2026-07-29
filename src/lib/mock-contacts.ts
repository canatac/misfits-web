/**
 * Mock contacts used for recipient autocompletion AND the address book seed.
 * Issue #152 — expanded to 40+ contacts with companies, roles, and tags.
 *
 * `MockContact` (id/name/email/color) stays the minimal shape consumed by the
 * recipient-input autocomplete. `mockContactSeeds` is the richer `Contact`
 * shape used to seed the address-book store. `searchContacts` remains for the
 * recipient input; the store has its own richer search.
 */
import type { Contact, ContactGroup } from "@/types/contact";

export interface MockContact {
  id: string;
  name: string;
  email: string;
  /** Avatar background colour (hex). */
  color: string;
}

export const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

function color(i: number): string {
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

/** Days-ago helper for seed `lastContactAt` timestamps. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* Groups                                                            */
/* ------------------------------------------------------------------ */

export const mockContactGroups: ContactGroup[] = [
  { id: "grp-team", name: "Engineering Team", color: "#6366f1", description: "misfits.ai engineers", createdAt: new Date().toISOString() },
  { id: "grp-leads", name: "Team Leads", color: "#8b5cf6", description: "People managers", createdAt: new Date().toISOString() },
  { id: "grp-investors", name: "Investors", color: "#22c55e", description: "VCs and angels", createdAt: new Date().toISOString() },
  { id: "grp-partners", name: "Partners", color: "#f97316", description: "Integration partners", createdAt: new Date().toISOString() },
  { id: "grp-personal", name: "Personal", color: "#ec4899", description: "Friends and family", createdAt: new Date().toISOString() },
];

/* ------------------------------------------------------------------ */
/* Rich seed data (Contact shape)                                    */
/* ------------------------------------------------------------------ */

type Seed = Omit<Contact, "createdAt" | "updatedAt">;

const seeds: Seed[] = [
  // --- misfits.ai engineering team ---
  { id: "c1", name: "Ada Lovelace", email: "ada@misfits.ai", company: "misfits.ai", role: "Principal Engineer", avatarColor: color(0), lastContactAt: daysAgo(0), contactFrequency: "daily", tags: ["engineering", "founder", "vip"], groupId: "grp-team", notes: "Original architect of the inbox triage engine." },
  { id: "c2", name: "Alan Turing", email: "alan@misfits.ai", company: "misfits.ai", role: "ML Researcher", avatarColor: color(1), lastContactAt: daysAgo(1), contactFrequency: "daily", tags: ["engineering", "research"], groupId: "grp-team" },
  { id: "c3", name: "Grace Hopper", email: "grace@misfits.ai", company: "misfits.ai", role: "Staff Engineer", avatarColor: color(2), lastContactAt: daysAgo(2), contactFrequency: "weekly", tags: ["engineering", "compiler"], groupId: "grp-team" },
  { id: "c4", name: "Linus Torvalds", email: "linus@misfits.ai", company: "misfits.ai", role: "Distinguished Engineer", avatarColor: color(3), lastContactAt: daysAgo(3), contactFrequency: "weekly", tags: ["engineering", "kernel"], groupId: "grp-team" },
  { id: "c5", name: "Margaret Hamilton", email: "margaret@misfits.ai", company: "misfits.ai", role: "Reliability Lead", avatarColor: color(4), lastContactAt: daysAgo(5), contactFrequency: "weekly", tags: ["engineering", "reliability"], groupId: "grp-team" },
  { id: "c6", name: "Dennis Ritchie", email: "dennis@misfits.ai", company: "misfits.ai", role: "Language Designer", avatarColor: color(5), lastContactAt: daysAgo(8), contactFrequency: "weekly", tags: ["engineering", "systems"], groupId: "grp-team" },
  { id: "c7", name: "Katherine Johnson", email: "katherine@misfits.ai", company: "misfits.ai", role: "Data Scientist", avatarColor: color(6), lastContactAt: daysAgo(6), contactFrequency: "weekly", tags: ["data", "research"], groupId: "grp-team" },
  { id: "c8", name: "Tim Berners-Lee", email: "tim@misfits.ai", company: "misfits.ai", role: "Protocol Architect", avatarColor: color(7), lastContactAt: daysAgo(12), contactFrequency: "monthly", tags: ["engineering", "protocols"], groupId: "grp-team" },
  { id: "c9", name: "Barbara Liskov", email: "barbara@misfits.ai", company: "misfits.ai", role: "Distributed Systems Lead", avatarColor: color(8), lastContactAt: daysAgo(9), contactFrequency: "weekly", tags: ["engineering", "distributed"], groupId: "grp-team" },
  { id: "c10", name: "John Carmack", email: "john@misfits.ai", company: "misfits.ai", role: "Rendering Engineer", avatarColor: color(9), lastContactAt: daysAgo(15), contactFrequency: "monthly", tags: ["engineering", "graphics"], groupId: "grp-team" },
  { id: "c11", name: "Hedy Lamarr", email: "hedy@misfits.ai", company: "misfits.ai", role: "Security Engineer", avatarColor: color(0), lastContactAt: daysAgo(7), contactFrequency: "weekly", tags: ["security", "research"], groupId: "grp-team" },
  { id: "c12", name: "Donald Knuth", email: "donald@misfits.ai", company: "misfits.ai", role: "Algorithms Architect", avatarColor: color(1), lastContactAt: daysAgo(20), contactFrequency: "monthly", tags: ["algorithms", "engineering"], groupId: "grp-team" },
  { id: "c13", name: "Claude Shannon", email: "claude@misfits.ai", company: "misfits.ai", role: "Information Theorist", avatarColor: color(2), lastContactAt: daysAgo(18), contactFrequency: "monthly", tags: ["research", "theory"], groupId: "grp-team" },
  { id: "c14", name: "Radia Perlman", email: "radia@misfits.ai", company: "misfits.ai", role: "Network Architect", avatarColor: color(3), lastContactAt: daysAgo(22), contactFrequency: "monthly", tags: ["networking", "engineering"], groupId: "grp-team" },

  // --- Team leads / managers ---
  { id: "c15", name: "Sarah Chen", email: "sarah.chen@misfits.ai", company: "misfits.ai", role: "VP Engineering", avatarColor: color(4), lastContactAt: daysAgo(0), contactFrequency: "daily", tags: ["leadership", "vip"], groupId: "grp-leads", notes: "Owns the Q3 roadmap review." },
  { id: "c16", name: "Marcus Rodriguez", email: "marcus@misfits.ai", company: "misfits.ai", role: "Head of Product", avatarColor: color(5), lastContactAt: daysAgo(1), contactFrequency: "daily", tags: ["product", "leadership"], groupId: "grp-leads" },
  { id: "c17", name: "Priya Patel", email: "priya@misfits.ai", company: "misfits.ai", role: "Design Director", avatarColor: color(6), lastContactAt: daysAgo(4), contactFrequency: "weekly", tags: ["design", "leadership"], groupId: "grp-leads" },
  { id: "c18", name: "James Okafor", email: "james@misfits.ai", company: "misfits.ai", role: "Head of Growth", avatarColor: color(7), lastContactAt: daysAgo(6), contactFrequency: "weekly", tags: ["growth", "leadership"], groupId: "grp-leads" },

  // --- Investors ---
  { id: "c19", name: "Satoshi Nakamoto", email: "satoshi@example.com", company: "Bitcoin Foundation", role: "Advisor", avatarColor: color(8), lastContactAt: daysAgo(45), contactFrequency: "rarely", tags: ["investor", "advisor", "crypto"], groupId: "grp-investors" },
  { id: "c20", name: "Elon Musk", email: "elon@futurefund.vc", company: "Future Fund", role: "Partner", avatarColor: color(9), lastContactAt: daysAgo(30), contactFrequency: "monthly", tags: ["investor", "vc"], groupId: "grp-investors" },
  { id: "c21", name: "Gwynne Shotwell", email: "gwynne@orbitvc.com", company: "Orbit Ventures", role: "Managing Partner", avatarColor: color(0), lastContactAt: daysAgo(60), contactFrequency: "rarely", tags: ["investor", "vc"], groupId: "grp-investors" },
  { id: "c22", name: "Reid Hoffman", email: "reid@linkedcapital.com", company: "Linked Capital", role: "Angel", avatarColor: color(1), lastContactAt: daysAgo(75), contactFrequency: "rarely", tags: ["investor", "angel"], groupId: "grp-investors" },

  // --- Partners / integrations ---
  { id: "c23", name: "Leslie Alexander", email: "leslie@acme-corp.com", company: "Acme Corp", role: "Partnerships Manager", avatarColor: color(0), lastContactAt: daysAgo(14), contactFrequency: "monthly", tags: ["partner", "sales"], groupId: "grp-partners" },
  { id: "c24", name: "Werner Vogels", email: "werner@cloudscale.io", company: "CloudScale", role: "CTO", avatarColor: color(2), lastContactAt: daysAgo(25), contactFrequency: "monthly", tags: ["partner", "infra"], groupId: "grp-partners" },
  { id: "c25", name: "Patrick Collison", email: "patrick@stripe.io", company: "Stripe", role: "CEO", avatarColor: color(4), lastContactAt: daysAgo(40), contactFrequency: "rarely", tags: ["partner", "payments"], groupId: "grp-partners" },
  { id: "c26", name: "Mitchell Baker", email: "mitchell@mozillafdn.org", company: "Mozilla Foundation", role: "Executive Director", avatarColor: color(6), lastContactAt: daysAgo(90), contactFrequency: "rarely", tags: ["partner", "nonprofit"], groupId: "grp-partners" },

  // --- Personal contacts ---
  { id: "c27", name: "Jane Cooper", email: "jane.cooper@gmail.com", avatarColor: color(5), lastContactAt: daysAgo(3), contactFrequency: "weekly", tags: ["friend", "personal"], groupId: "grp-personal" },
  { id: "c28", name: "Esther Howard", email: "esther.howard@outlook.com", avatarColor: color(6), lastContactAt: daysAgo(10), contactFrequency: "monthly", tags: ["family", "personal"], groupId: "grp-personal" },
  { id: "c29", name: "Wade Warren", email: "wade.warren@yahoo.com", avatarColor: color(7), lastContactAt: daysAgo(28), contactFrequency: "monthly", tags: ["friend", "personal"], groupId: "grp-personal" },
  { id: "c30", name: "Cameron Williamson", email: "cameron@proton.me", avatarColor: color(8), lastContactAt: daysAgo(50), contactFrequency: "rarely", tags: ["personal"], groupId: "grp-personal" },
  { id: "c31", name: "Brooklyn Simmons", email: "brooklyn@fastmail.com", avatarColor: color(9), lastContactAt: daysAgo(120), contactFrequency: "rarely", tags: ["personal"], groupId: "grp-personal" },

  // --- External / customers / misc (ungrouped) ---
  { id: "c32", name: "Team Leads", email: "leads@misfits.ai", avatarColor: color(1), lastContactAt: daysAgo(2), contactFrequency: "weekly", tags: ["mailing-list"] },
  { id: "c33", name: "All Staff", email: "everyone@misfits.ai", avatarColor: color(2), lastContactAt: daysAgo(1), contactFrequency: "weekly", tags: ["mailing-list"] },
  { id: "c34", name: "Support Desk", email: "support@misfits.ai", avatarColor: color(3), lastContactAt: daysAgo(5), contactFrequency: "weekly", tags: ["support"] },
  { id: "c35", name: "Robert Fox", email: "robert.fox@techreview.com", company: "Tech Review", role: "Journalist", avatarColor: color(4), lastContactAt: daysAgo(35), contactFrequency: "rarely", tags: ["press", "external"] },
  { id: "c36", name: "Natalie Reyes", email: "natalie@designhub.co", company: "DesignHub", role: "Product Designer", avatarColor: color(5), lastContactAt: daysAgo(16), contactFrequency: "monthly", tags: ["design", "external"] },
  { id: "c37", name: "Devon Lane", email: "devon@startupweekly.io", company: "Startup Weekly", role: "Editor", avatarColor: color(6), lastContactAt: daysAgo(48), contactFrequency: "rarely", tags: ["press"] },
  { id: "c38", name: "Frieda Vargas", email: "frieda@legalpartners.com", company: "Legal Partners LLP", role: "Counsel", avatarColor: color(7), lastContactAt: daysAgo(33), contactFrequency: "rarely", tags: ["legal", "external"], notes: "Outside counsel for trademark filings." },
  { id: "c39", name: "Olive Hughes", email: "olive.hughes@bigboxco.com", company: "BigBox Co", role: "Procurement", avatarColor: color(8), lastContactAt: daysAgo(72), contactFrequency: "rarely", tags: ["vendor", "external"] },
  { id: "c40", name: "Hank Gardner", email: "hank@devtools.fm", company: "DevTools FM", role: "Podcast Host", avatarColor: color(9), lastContactAt: daysAgo(58), contactFrequency: "rarely", tags: ["press", "podcast"] },
  { id: "c41", name: "Ida Bell", email: "ida.bell@quantumedge.ai", company: "QuantumEdge", role: "Research Scientist", avatarColor: color(0), lastContactAt: daysAgo(11), contactFrequency: "monthly", tags: ["research", "external"] },
  { id: "c42", name: "Mona Petersen", email: "mona@nordicvc.no", company: "Nordic VC", role: "Associate", avatarColor: color(2), lastContactAt: daysAgo(27), contactFrequency: "monthly", tags: ["investor", "vc", "external"] },
  { id: "c43", name: "Cody Nguyen", email: "cody.nguyen@apiforge.dev", company: "API Forge", role: "Developer Advocate", avatarColor: color(3), lastContactAt: daysAgo(19), contactFrequency: "monthly", tags: ["partner", "devrel", "external"] },
  { id: "c44", name: "Zara Khan", email: "zara@brandstudio.com", company: "Brand Studio", role: "Creative Director", avatarColor: color(5), lastContactAt: daysAgo(44), contactFrequency: "rarely", tags: ["agency", "external"] },
];

/** Full Contact-shaped seeds for the address book store (createdAt/updatedAt added by the store). */
export const mockContactSeeds: Seed[] = seeds.map((s) => ({ ...s }));

/** Backwards-compatible minimal list consumed by the recipient input. */
export const mockContacts: MockContact[] = mockContactSeeds.map((c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  color: c.avatarColor,
}));

/**
 * Search contacts by name or email, case-insensitive, capped results.
 * Used by the recipient-input autocomplete.
 */
export function searchContacts(query: string, limit = 8): MockContact[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockContacts.slice(0, limit);
  return mockContacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
    .slice(0, limit);
}
