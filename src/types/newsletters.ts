export type NewsletterTopic =
  | "Tech"
  | "Finance"
  | "Lifestyle"
  | "Science"
  | "Design";

export type NewsletterLink = {
  name: string;
  url: string;
};

export type NewsletterSource = {
  id: string;
  name: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterItem = {
  id: string;
  sourceId: string;
  title: string;
  topic: NewsletterTopic | string;
  summary: string;
  signal: number;
  links: NewsletterLink[];
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSourcesResponse = {
  sources: NewsletterSource[];
  total: number;
};

export type NewsletterItemsResponse = {
  items: NewsletterItem[];
  total: number;
};

export type CreateNewsletterSourceInput = {
  name: string;
  url?: string;
};

export type UpdateNewsletterSourceInput = {
  name?: string;
  url?: string;
};

export type CreateNewsletterItemInput = {
  sourceId: string;
  title: string;
  summary: string;
  topic?: NewsletterTopic | string;
  link?: string;
  signal?: number;
};

export type SummarizeNewsletterSourceInput = {
  topic?: NewsletterTopic | string;
};

export type SummarizeNewsletterSourceResponse = {
  item: NewsletterItem;
  source: {
    id: string;
    name: string;
    url: string;
  };
  model: string;
  fetchedChars: number;
};

export type NewsletterSuggestionKind = "rss" | "site" | "article";

export type NewsletterSubscriptionSuggestion = {
  title: string;
  url: string;
  kind: NewsletterSuggestionKind;
  reason: string;
  matchedInterests: string[];
  matchScore: number;
};

export type NewsletterSuggestionsResponse = {
  suggestions: NewsletterSubscriptionSuggestion[];
  interests: string[];
  generatedAt: string;
  total: number;
};

export type NewsletterMonitoringSnapshot = {
  status: "idle" | "running";
  updatedAt: string;
  lastSummaryAt?: string;
  activeSources: number;
  totalSummaries: number;
  summaries24h: number;
  runCount: number;
  runningCount: number;
  failedCount: number;
  successRate: number;
  totalTokens: number;
  totalCostUsd: number;
};
