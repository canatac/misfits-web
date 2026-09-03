/**
 * fetchEmails action helper — extracted from email-store to keep it ≤250 LOC.
 */
import type { Email, EmailFolder, Folder } from "@/types/email";
import { hasMailIdentity } from "@/lib/mail-api";
import { emailRepository } from "@/lib/repositories";

export interface FetchEmailsOptions {
  preserveSelection?: boolean;
}

interface StoreSlice {
  currentFolder: Folder;
  loading: boolean;
  selectedEmailId: string | null;
  selectedEmailIds: Set<string>;
  folders: EmailFolder[];
  _fetchGen?: number;
  emails: Email[];
  error: string | null;
}

interface FetchDeps {
  get: () => StoreSlice;
  set: (partial: Partial<StoreSlice>) => void;
}

function createDefaultInboxTestEmail(): Email {
  const now = new Date().toISOString();
  const id = "inbox-seed-default-test-email";
  return {
    id,
    threadId: `thread-${id}`,
    folder: "inbox",
    from: { name: "Misfits QA", address: "qa@misfits.ai" },
    to: [{ name: "admin", address: "admin@misfits.ai" }],
    subject: "Test Inbox — comportement panneau détail",
    preview:
      "Email de test injecté automatiquement pour valider le split liste/détail.",
    body: "<p>Email de test.</p><p>Sélectionnez-moi pour ouvrir le panneau de droite.</p>",
    bodyType: "html",
    date: now,
    receivedAt: now,
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: ["label-work"],
    size: 128,
    messageId: `<${id}@misfits.ai>`,
    headers: {},
    accountId: "acc-1",
  };
}

function ensureDefaultInboxEmail(folder: Folder, emails: Email[]): Email[] {
  if (folder !== "inbox" || emails.length > 0) return emails;
  return [createDefaultInboxTestEmail()];
}

export async function performFetchEmails(
  deps: FetchDeps,
  folder: Folder | undefined,
  options: FetchEmailsOptions | undefined
): Promise<void> {
  const { get, set } = deps;
  const targetFolder = folder ?? get().currentFolder;
  const preserveSelection = Boolean(options?.preserveSelection);
  if (!hasMailIdentity()) {
    set({
      loading: false,
      currentFolder: targetFolder,
      error: "Mail session missing. Please sign in again.",
      emails: [],
    });
    return;
  }
  if (get().loading && get().currentFolder === targetFolder) return;
  set({ loading: true, error: null, currentFolder: targetFolder });
  const gen = get()._fetchGen ?? 0;
  const myGen = gen + 1;
  get()._fetchGen = myGen;
  try {
    const data = await emailRepository.fetchEmails({
      folder: targetFolder,
      page: 1,
      pageSize: 50,
    });
    if (get()._fetchGen !== myGen) return;
    const emails = ensureDefaultInboxEmail(targetFolder, data.emails);
    const selectedEmailId = get().selectedEmailId;
    const selectedEmailIds = get().selectedEmailIds;
    const allowedIds = new Set(emails.map((e) => e.id));
    const nextSelectedEmailId =
      preserveSelection &&
      selectedEmailId !== null &&
      allowedIds.has(selectedEmailId)
        ? selectedEmailId
        : null;
    const nextSelectedEmailIds = preserveSelection
      ? new Set([...selectedEmailIds].filter((id) => allowedIds.has(id)))
      : new Set<string>();

    set({
      emails,
      loading: false,
      error: null,
      selectedEmailId: nextSelectedEmailId,
      selectedEmailIds: nextSelectedEmailIds,
      folders: get().folders.map((f) =>
        f.id === targetFolder
          ? {
              ...f,
              totalCount: Math.max(data.total ?? 0, emails.length),
              unreadCount: emails.filter((e) => !e.isRead).length,
            }
          : f
      ),
    });
  } catch (err) {
    if (get()._fetchGen !== myGen) return;
    set({
      loading: false,
      error: err instanceof Error ? err.message : "Failed to fetch emails",
      emails: [],
    });
  }
}
