/**
 * Mock contacts used for recipient autocompletion.
 * 24 contacts across internal (misfits.ai) and external domains.
 */

export interface MockContact {
  id: string;
  name: string;
  email: string;
  /** Avatar background colour (hex). */
  color: string;
}

const COLORS = [
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
  return COLORS[i % COLORS.length];
}

export const mockContacts: MockContact[] = [
  { id: "c1", name: "Ada Lovelace", email: "ada@misfits.ai", color: color(0) },
  { id: "c2", name: "Alan Turing", email: "alan@misfits.ai", color: color(1) },
  { id: "c3", name: "Grace Hopper", email: "grace@misfits.ai", color: color(2) },
  { id: "c4", name: "Linus Torvalds", email: "linus@misfits.ai", color: color(3) },
  { id: "c5", name: "Margaret Hamilton", email: "margaret@misfits.ai", color: color(4) },
  { id: "c6", name: "Dennis Ritchie", email: "dennis@misfits.ai", color: color(5) },
  { id: "c7", name: "Katherine Johnson", email: "katherine@misfits.ai", color: color(6) },
  { id: "c8", name: "Tim Berners-Lee", email: "tim@misfits.ai", color: color(7) },
  { id: "c9", name: "Barbara Liskov", email: "barbara@misfits.ai", color: color(8) },
  { id: "c10", name: "John Carmack", email: "john@misfits.ai", color: color(9) },
  { id: "c11", name: "Hedy Lamarr", email: "hedy@misfits.ai", color: color(0) },
  { id: "c12", name: "Donald Knuth", email: "donald@misfits.ai", color: color(1) },
  { id: "c13", name: "Claude Shannon", email: "claude@misfits.ai", color: color(2) },
  { id: "c14", name: "Radia Perlman", email: "radia@misfits.ai", color: color(3) },
  { id: "c15", name: "Satoshi Nakamoto", email: "satoshi@example.com", color: color(4) },
  { id: "c16", name: "Jane Cooper", email: "jane.cooper@gmail.com", color: color(5) },
  { id: "c17", name: "Esther Howard", email: "esther.howard@outlook.com", color: color(6) },
  { id: "c18", name: "Wade Warren", email: "wade.warren@yahoo.com", color: color(7) },
  { id: "c19", name: "Cameron Williamson", email: "cameron@proton.me", color: color(8) },
  { id: "c20", name: "Brooklyn Simmons", email: "brooklyn@fastmail.com", color: color(9) },
  { id: "c21", name: "Leslie Alexander", email: "leslie@acme-corp.com", color: color(0) },
  { id: "c22", name: "Team Leads", email: "leads@misfits.ai", color: color(1) },
  { id: "c23", name: "All Staff", email: "everyone@misfits.ai", color: color(2) },
  { id: "c24", name: "Support Desk", email: "support@misfits.ai", color: color(3) },
];

/**
 * Search contacts by name or email, case-insensitive, capped results.
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
