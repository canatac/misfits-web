/**
 * Composer store send helpers — extracted from composer-store.ts (cycle 57).
 * Builds the payload from a snapshot and delegates to composerRepository.
 */
import type { SendOptions } from "@/types/composer";
import { composerRepository } from "@/lib/repositories";
import { clearPersistedSnapshot, snapshot } from "./composer-store-helpers";

type SnapState = Parameters<typeof snapshot>[0];

function buildPayload(snap: ReturnType<typeof snapshot>) {
  return {
    to: snap.to.map((r) => ({ email: r.email, name: r.name })),
    cc: snap.cc.map((r) => ({ email: r.email, name: r.name })),
    bcc: snap.bcc.map((r) => ({ email: r.email, name: r.name })),
    subject: snap.subject,
    body: snap.body,
  };
}

export async function sendComposer(
  state: SnapState,
  options?: SendOptions
): Promise<void> {
  const snap = snapshot(state);
  await composerRepository.send(buildPayload(snap), options);
  clearPersistedSnapshot();
}

export async function scheduleComposer(
  state: SnapState,
  date: string
): Promise<void> {
  const snap = snapshot(state);
  await composerRepository.schedule(buildPayload(snap), date);
}
