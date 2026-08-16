export type AvatarOption = {
  id: string;
  name: string;
  background: string;
};

const AVATAR_PALETTES = [
  ["#22c55e", "#0ea5e9"],
  ["#f97316", "#ef4444"],
  ["#3b82f6", "#14b8a6"],
  ["#eab308", "#f97316"],
  ["#06b6d4", "#6366f1"],
  ["#84cc16", "#14b8a6"],
  ["#f43f5e", "#8b5cf6"],
  ["#10b981", "#22c55e"],
  ["#0ea5e9", "#2563eb"],
  ["#ef4444", "#f59e0b"],
] as const;

const SYLLABLE_ONSETS = [
  "b", "c", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z",
] as const;

const SYLLABLE_VOWELS = ["a", "e", "i", "o", "u", "ai", "ou"] as const;
const SYLLABLE_CODAS = ["", "n", "r", "s", "m", "l"] as const;

export function hashText(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initialsFromName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return "UA";

  const parts = normalized.split(/[-\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]?.toUpperCase() ?? "U"}${parts[1][0]?.toUpperCase() ?? "A"}`;
  }

  const one = parts[0] ?? normalized;
  const first = one[0]?.toUpperCase() ?? "U";
  const second = one[1]?.toUpperCase() ?? "A";
  return `${first}${second}`;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPseudoWord(seed: number, syllables: 1 | 2): string {
  const rng = makeRng(seed);
  let word = "";

  for (let i = 0; i < syllables; i += 1) {
    const onset = SYLLABLE_ONSETS[Math.floor(rng() * SYLLABLE_ONSETS.length)];
    const vowel = SYLLABLE_VOWELS[Math.floor(rng() * SYLLABLE_VOWELS.length)];
    const coda = SYLLABLE_CODAS[Math.floor(rng() * SYLLABLE_CODAS.length)];
    word += `${onset}${vowel}${coda}`;
  }

  const shortened = word
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1")
    .slice(0, 6);

  if (shortened.length >= 3) return shortened;
  return `${shortened}a`.slice(0, 3);
}

export function sanitizeAvatarName(input: string): string {
  const sanitized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);

  return sanitized || "user-avatar";
}

export function buildAvatarOptions(salt: number): AvatarOption[] {
  const seedBase = `avatar-${salt}`;
  const baseHash = hashText(seedBase || "avatar");
  const usedNames = new Set<string>();

  return Array.from({ length: 6 }, (_, i) => {
    const idx = (baseHash + i * 13) % AVATAR_PALETTES.length;
    const [c1, c2] = AVATAR_PALETTES[idx];

    let step = 0;
    let generatedName = "user-avatar";
    while (step < 50) {
      const leftSeed = hashText(`${baseHash}-${i}-${step}-left`);
      const rightSeed = hashText(`${baseHash}-${i}-${step}-right`);
      const left = createPseudoWord(leftSeed, leftSeed % 2 === 0 ? 1 : 2);
      const right = createPseudoWord(rightSeed, rightSeed % 2 === 0 ? 1 : 2);
      generatedName = sanitizeAvatarName(`${left}-${right}`);
      if (!usedNames.has(generatedName)) break;
      step += 1;
    }
    usedNames.add(generatedName);

    return {
      id: `avatar-slot-${i}`,
      name: generatedName,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
    };
  });
}
