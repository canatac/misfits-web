/**
 * Zustand store for email state management.
 * Handles email list, selection, folders, labels, filters, sorting, and bulk actions.
 */
import { create } from "zustand";
import type {
  Email,
  EmailFolder,
  EmailLabel,
  Folder,
  FilterType,
  SortBy,
} from "@/types/email";
import { mockFolders, mockLabels } from "@/lib/mock-emails";
import { hasMailIdentity } from "@/lib/mail-api";
import { emailRepository } from "@/lib/repositories";
import {
  applyBulkAction,
  filterEmails,
  sortEmails,
  type BulkActionType,
} from "./parts/email-store/utils";

export type { BulkActionType };

interface FetchEmailsOptions {
  preserveSelection?: boolean;
}

interface EmailState {
  // Data
  emails: Email[];
  selectedEmailId: string | null;
  folders: EmailFolder[];
  labels: EmailLabel[];
  currentFolder: Folder;
  sortBy: SortBy;
  filterType: FilterType;
  searchQuery: string;
  selectedEmailIds: Set<string>;
  loading: boolean;
  error: string | null;
  /** Active account filter (Issue #154). null = all accounts (unified inbox). */
  accountId: string | null;

  // Actions
  fetchEmails: (folder?: Folder, options?: FetchEmailsOptions) => Promise<void>;
  selectEmail: (id: string | null) => void;
  toggleStar: (id: string) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  archive: (id: string) => void;
  deleteEmail: (id: string) => void;
  bulkAction: (action: BulkActionType) => void;
  setFolder: (folder: Folder) => void;
  setSortBy: (sortBy: SortBy) => void;
  setFilterType: (filterType: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setAccountId: (accountId: string | null) => void;
  toggleEmailSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  selectedEmailId: null,
  folders: mockFolders,
  labels: mockLabels,
  currentFolder: "inbox",
  sortBy: "date",
  filterType: "all",
  searchQuery: "",
  selectedEmailIds: new Set(),
  loading: false,
  error: null,
  accountId: null,

  fetchEmails: async (folder, options) => {
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
    const gen = (get() as { _fetchGen?: number })._fetchGen ?? 0;
    const myGen = gen + 1;
    (get() as { _fetchGen?: number })._fetchGen = myGen;
    try {
      const data = await emailRepository.fetchEmails({
        folder: targetFolder,
        page: 1,
        pageSize: 50,
      });
      if ((get() as { _fetchGen?: number })._fetchGen !== myGen) return;
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
      if ((get() as { _fetchGen?: number })._fetchGen !== myGen) return;
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch emails",
        emails: [],
      });
    }
  },

  selectEmail: (id) => {
    set({ selectedEmailId: id });
    if (id) {
      const email = get().emails.find((e) => e.id === id);
      if (email && !email.isRead) {
        set((state) => ({
          emails: state.emails.map((e) =>
            e.id === id ? { ...e, isRead: true } : e
          ),
        }));
      }
    }
  },

  toggleStar: (id) =>
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isStarred: !e.isStarred } : e
      ),
    })),

  markRead: (id) =>
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isRead: true } : e
      ),
    })),

  markUnread: (id) =>
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isRead: false } : e
      ),
    })),

  archive: (id) => {
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, folder: "archive" as Folder } : e
      ),
      selectedEmailId:
        state.selectedEmailId === id ? null : state.selectedEmailId,
    }));
    const { currentFolder } = get();
    set((state) => ({
      emails: state.emails.filter(
        (e) => e.folder === currentFolder || e.id !== id
      ),
    }));
  },

  deleteEmail: (id) =>
    set((state) => {
      const next = new Set(state.selectedEmailIds);
      next.delete(id);
      return {
        emails: state.emails.filter((e) => e.id !== id),
        selectedEmailId:
          state.selectedEmailId === id ? null : state.selectedEmailId,
        selectedEmailIds: next,
      };
    }),

  bulkAction: (action) => {
    const ids = get().selectedEmailIds;
    if (ids.size === 0) return;
    set((state) => ({
      emails: state.emails
        .map((e) => (ids.has(e.id) ? applyBulkAction(e, action) : e))
        .filter((e): e is Email => e !== null),
      selectedEmailIds: new Set(),
    }));
    const { currentFolder } = get();
    set((state) => ({
      emails: state.emails.filter((e) => e.folder === currentFolder),
    }));
  },

  setFolder: (folder) => {
    set({
      currentFolder: folder,
      selectedEmailId: null,
      selectedEmailIds: new Set(),
    });
    get().fetchEmails(folder);
  },

  setSortBy: (sortBy) => set({ sortBy }),
  setFilterType: (filterType) =>
    set({ filterType, selectedEmailIds: new Set() }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setAccountId: (accountId) => {
    if (get().accountId === accountId) return;
    set({ accountId, selectedEmailId: null, selectedEmailIds: new Set() });
  },

  toggleEmailSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedEmailIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedEmailIds: next };
    });
  },

  clearSelection: () => set({ selectedEmailIds: new Set() }),
}));

/**
 * Selector: filtered + sorted emails for the current view.
 */
export function useFilteredSortedEmails(): Email[] {
  const emails = useEmailStore((s) => s.emails);
  const sortBy = useEmailStore((s) => s.sortBy);
  const filterType = useEmailStore((s) => s.filterType);
  const searchQuery = useEmailStore((s) => s.searchQuery);
  const accountId = useEmailStore((s) => s.accountId);
  const filtered = filterEmails(emails, filterType, searchQuery, accountId);
  return sortEmails(filtered, sortBy);
}
