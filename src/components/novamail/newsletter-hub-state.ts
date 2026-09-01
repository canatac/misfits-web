export type NewsletterTopic =
  | "Tech"
  | "Finance"
  | "Lifestyle"
  | "Science"
  | "Design";

export type NewsletterSource = {
  id: string;
  name: string;
  url?: string;
  createdAt: string;
};

export type NewsletterItem = {
  id: string;
  sourceId: string;
  title: string;
  topic: NewsletterTopic;
  summary: string;
  signal: number;
  links: Array<{ name: string; url: string }>;
  createdAt: string;
};

export type NewsletterHubState = {
  sources: NewsletterSource[];
  items: NewsletterItem[];
};

const STORAGE_KEY = "newsletter-hub:v1";

const now = () => new Date().toISOString();

const SEED_STATE: NewsletterHubState = {
  sources: [
    {
      id: "src-byte-report",
      name: "The Byte Report",
      createdAt: now(),
      url: "https://example.com/byte-report",
    },
    {
      id: "src-market-edge",
      name: "Market Edge",
      createdAt: now(),
      url: "https://example.com/market-edge",
    },
  ],
  items: [
    {
      id: "n1",
      sourceId: "src-byte-report",
      title: "The Byte Report",
      topic: "Tech",
      summary: "Coverage IA produits, agents autonomes, et tendances infra.",
      signal: 92,
      links: [{ name: "Source", url: "https://example.com/byte-report" }],
      createdAt: now(),
    },
    {
      id: "n2",
      sourceId: "src-market-edge",
      title: "Market Edge",
      topic: "Finance",
      summary: "Volatilité macro, rendements, et impact sur le risque projet.",
      signal: 84,
      links: [{ name: "Source", url: "https://example.com/market-edge" }],
      createdAt: now(),
    },
  ],
};

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function loadNewsletterHubState(): NewsletterHubState {
  if (typeof window === "undefined") return SEED_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_STATE;
    const parsed = JSON.parse(raw) as Partial<NewsletterHubState>;
    const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    if (sources.length === 0) return SEED_STATE;
    return { sources, items };
  } catch {
    return SEED_STATE;
  }
}

export function saveNewsletterHubState(state: NewsletterHubState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota/private-mode failures
  }
}
