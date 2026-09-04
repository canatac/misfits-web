import { apiClient } from "@/lib/api-client";
import type {
  CreateNewsletterItemInput,
  CreateNewsletterSourceInput,
  NewsletterItem,
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
