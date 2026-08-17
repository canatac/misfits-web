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
    const emails = data.emails;
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
              totalCount: data.total ?? emails.length,
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
