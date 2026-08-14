/**
 * Repository couche réseau pour composer-store.
 *
 * Extrait les appels HTTP /api/send et /api/send/schedule.
 * Copie verbatim des headers/URLs depuis src/stores/composer-store.ts.
 */
import type { SendOptions } from "@/types/composer";
import { mailAuthHeaders } from "@/lib/mail-api";

export interface Recipient {
  email: string;
  name?: string;
}

export interface SendPayload {
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
}

export interface ComposerRepository {
  send(payload: SendPayload, options?: SendOptions): Promise<void>;
  schedule(payload: SendPayload, sendLater: string): Promise<void>;
}

export class HttpComposerRepository implements ComposerRepository {
  async send(payload: SendPayload, options?: SendOptions): Promise<void> {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: mailAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        ...options,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(errBody || `Send failed: ${res.status}`);
    }
  }

  async schedule(payload: SendPayload, sendLater: string): Promise<void> {
    const res = await fetch("/api/send/schedule", {
      method: "POST",
      headers: mailAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        sendLater,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(errBody || `Schedule failed: ${res.status}`);
    }
  }
}

export const composerRepository: ComposerRepository =
  new HttpComposerRepository();
