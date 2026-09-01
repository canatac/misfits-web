import { apiClient } from "@/lib/api-client";
import type {
  CreateNewsletterItemInput,
  CreateNewsletterSourceInput,
  NewsletterItem,
  NewsletterItemsResponse,
  NewsletterSource,
  NewsletterSourcesResponse,
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

export async function listNewsletterItems(): Promise<NewsletterItem[]> {
  const data = await apiClient.get<NewsletterItemsResponse>("/newsletters/items");
  return Array.isArray(data.items) ? data.items : [];
}

export async function createNewsletterItem(
  payload: CreateNewsletterItemInput
): Promise<NewsletterItem> {
  return apiClient.post<NewsletterItem>("/newsletters/items", payload);
}
