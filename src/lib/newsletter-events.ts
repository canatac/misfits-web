const NEWSLETTER_UPDATED_EVENT = "misfits:newsletter-updated";
const NEWSLETTER_BROADCAST_CHANNEL = "misfits-newsletters";

type NewsletterListener = () => void;

function createBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(NEWSLETTER_BROADCAST_CHANNEL);
  } catch {
    return null;
  }
}

export function emitNewsletterUpdated(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(NEWSLETTER_UPDATED_EVENT));

  const channel = createBroadcastChannel();
  if (!channel) return;

  try {
    channel.postMessage({ type: NEWSLETTER_UPDATED_EVENT, ts: Date.now() });
  } finally {
    channel.close();
  }
}

export function onNewsletterUpdated(listener: NewsletterListener): () => void {
  if (typeof window === "undefined") return () => {};

  const onWindowEvent = () => listener();
  window.addEventListener(NEWSLETTER_UPDATED_EVENT, onWindowEvent as EventListener);

  const channel = createBroadcastChannel();
  const onChannelMessage = (event: MessageEvent) => {
    const payload = event.data as { type?: string } | null;
    if (payload?.type === NEWSLETTER_UPDATED_EVENT) listener();
  };

  channel?.addEventListener("message", onChannelMessage);

  return () => {
    window.removeEventListener(NEWSLETTER_UPDATED_EVENT, onWindowEvent as EventListener);
    channel?.removeEventListener("message", onChannelMessage);
    channel?.close();
  };
}
