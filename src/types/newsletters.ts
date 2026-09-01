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

export type CreateNewsletterItemInput = {
  sourceId: string;
  title: string;
  summary: string;
  topic?: NewsletterTopic | string;
  link?: string;
  signal?: number;
};
