/**
 * Repository couche réseau pour email-store.
 *
 * Extrait les appels HTTP du store Zustand pour :
 * - préparer le swap backend (mode démo, mocks, autre transport)
 * - découpler l'état UI de la sémantique HTTP
 *
 * Les appels sont copiés verbatim depuis src/stores/email-store.ts :
 * mêmes headers, mêmes params, mêmes URLs.
 */
import type { Email } from "@/types/email";
import { mailAuthHeaders } from "@/lib/mail-api";
import { normalizeEmailRecord } from "@/lib/email-normalization";

export interface FetchEmailsParams {
  folder: string;
  page?: number;
  pageSize?: number;
}

export interface FetchEmailsResult {
  emails: Email[];
  total: number;
}

export interface EmailRepository {
  fetchEmails(params: FetchEmailsParams): Promise<FetchEmailsResult>;
}

export class HttpEmailRepository implements EmailRepository {
  async fetchEmails({
    folder,
    page = 1,
    pageSize = 50,
  }: FetchEmailsParams): Promise<FetchEmailsResult> {
    const params = new URLSearchParams({
      folder,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`/api/emails?${params.toString()}`, {
      headers: mailAuthHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch emails: ${res.status}`);
    }
    const data = (await res.json()) as {
      emails?: Email[];
      total?: number;
    };
    const emails = Array.isArray(data.emails)
      ? data.emails.map((email) => normalizeEmailRecord(email))
      : [];
    return { emails, total: data.total ?? emails.length };
  }
}

export const emailRepository: EmailRepository = new HttpEmailRepository();
