import { apiClient } from "@/lib/api-client";
import type {
  AdminAiActivityResponse,
} from "@/types/admin-ops";
import type {
  CreateNewsletterItemInput,
  CreateNewsletterSourceInput,
  NewsletterItem,
  NewsletterMonitoringSnapshot,
  NewsletterItemsResponse,
  NewsletterSuggestionsResponse,
  NewsletterSubscriptionSuggestion,
  NewsletterSource,
  NewsletterSourcesResponse,
  SummarizeNewsletterSourceInput,
  SummarizeNewsletterSourceResponse,
  UpdateNewsletterSourceInput,
} from "@/types/newsletters";

export async function listNewsletterSources(): Promise<NewsletterSource[]> {
  const data = await apiClient.get<NewsletterSourcesResponse>("/newsletters/sources");
  return Array.isArray(data.sources) ? data.sources : [];
}

export async function createNewsletterSource(
  payload: CreateNewsletterSourceInput
): Promise<NewsletterSource> {
  return apiClient.post<NewsletterSource>("/newsletters/sources", payload);
}

export async function updateNewsletterSource(
  id: string,
  payload: UpdateNewsletterSourceInput
): Promise<NewsletterSource> {
  return apiClient.patch<NewsletterSource>(`/newsletters/sources/${id}`, payload);
}

export async function deleteNewsletterSource(id: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/newsletters/sources/${id}`);
}

export async function listNewsletterItems(): Promise<NewsletterItem[]> {
  const data = await apiClient.get<NewsletterItemsResponse>("/newsletters/items");
  return Array.isArray(data.items) ? data.items : [];
}

export async function createNewsletterItem(
  payload: CreateNewsletterItemInput
): Promise<NewsletterItem> {
  return apiClient.post<NewsletterItem>("/newsletters/items", payload);
}

export async function summarizeNewsletterSource(
  sourceId: string,
  payload: SummarizeNewsletterSourceInput = {}
): Promise<SummarizeNewsletterSourceResponse> {
  return apiClient.post<SummarizeNewsletterSourceResponse>(
    `/newsletters/sources/${sourceId}/summarize`,
    payload
  );
}

export async function listNewsletterSuggestions(): Promise<{
  suggestions: NewsletterSubscriptionSuggestion[];
  interests: string[];
}> {
  const data = await apiClient.get<NewsletterSuggestionsResponse>(
    "/newsletters/suggestions"
  );
  return {
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
  };
}

export async function getNewsletterMonitoringActivity(
  limit = 60
): Promise<AdminAiActivityResponse> {
  return apiClient.get<AdminAiActivityResponse>(`/admin/ai-activity?limit=${limit}`);
}

export function buildNewsletterMonitoringSnapshot(args: {
  activeSources: number;
  items: NewsletterItem[];
  aiBusy: boolean;
  activity?: AdminAiActivityResponse | null;
}): NewsletterMonitoringSnapshot {
  const now = new Date();
  const since24h = now.getTime() - 24 * 60 * 60 * 1000;
  const parseTs = (v?: string) => (v ? new Date(v).getTime() : Number.NaN);

  const lastSummaryAt = args.items
    .map((item) => item.updatedAt || item.createdAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const summaries24h = args.items.filter((item) => {
    const ts = parseTs(item.updatedAt || item.createdAt);
    return Number.isFinite(ts) && ts >= since24h;
  }).length;

  const runs = (args.activity?.runs ?? []).filter(
    (run) => (run.feature || "").toLowerCase() === "newsletter_summarize"
  );
  const byFeature = (args.activity?.byFeature ?? []).find(
    (f) => (f.feature || "").toLowerCase() === "newsletter_summarize"
  );

  const runningCount = runs.filter((run) => {
    const s = (run.status || "").toLowerCase();
    return s === "running" || s === "queued" || s === "in_progress";
  }).length;
  const failedCount = runs.filter((run) => (run.status || "").toLowerCase() === "failed").length;
  const completedCount = runs.filter((run) => {
    const s = (run.status || "").toLowerCase();
    return s === "completed" || s === "success";
  }).length;
  const runCount = byFeature?.runs ?? runs.length;
  const totalTokens = byFeature?.totalTokens ?? runs.reduce((acc, run) => acc + (run.totalTokens || 0), 0);
  const totalCostUsd =
    byFeature?.totalCostUsd ?? runs.reduce((acc, run) => acc + (run.estimatedCostUsd || 0), 0);
  const successRate = runCount > 0 ? Math.round((completedCount / runCount) * 100) : 0;

  return {
    status: args.aiBusy || runningCount > 0 ? "running" : "idle",
    updatedAt: now.toISOString(),
    lastSummaryAt,
    activeSources: args.activeSources,
    totalSummaries: args.items.length,
    summaries24h,
    runCount,
    runningCount,
    failedCount,
    successRate,
    totalTokens,
    totalCostUsd,
  };
}
