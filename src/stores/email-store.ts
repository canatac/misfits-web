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
import { hasMailIdentity, mailAuthHeaders } from "@/lib/mail-api";
import {
  applyBulkAction,
  filterEmails,
  sortEmails,
  type BulkActionType,
} from "./parts/email-store/utils";
import {
  performFetchEmails,
  type FetchEmailsOptions,
} from "./parts/email-store/fetch-emails";

export type { BulkActionType };

const SYNTHETIC_EMAIL_ID_PREFIX = "inbox-seed-";

function isSyntheticEmail(id: string): boolean {
  return id.startsWith(SYNTHETIC_EMAIL_ID_PREFIX);
}

async function persistEmailAction(
  id: string,
  action: "markRead" | "markUnread"
): Promise<void> {
  if (!hasMailIdentity() || isSyntheticEmail(id)) return;
  const res = await fetch(`/api/emails/${encodeURIComponent(id)}/action`, {
    method: "POST",
    headers: mailAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to persist email action ${action}: ${res.status} ${res.statusText}`
    );
  }
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
    await performFetchEmails(
      {
        get: () => get() as never,
        set: (partial) => set(partial as Partial<EmailState>),
      },
      folder,
      options
    );
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
        void persistEmailAction(id, "markRead").catch((err) => {
          console.error("selectEmail markRead persistence failed", err);
        });
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
    set((state) => {
      const email = state.emails.find((e) => e.id === id);
      if (!email || email.isRead) return { emails: state.emails };
      void persistEmailAction(id, "markRead").catch((err) => {
        console.error("markRead persistence failed", err);
      });
      return {
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, isRead: true } : e
        ),
      };
    }),

  markUnread: (id) =>
    set((state) => {
      const email = state.emails.find((e) => e.id === id);
      if (!email || !email.isRead) return { emails: state.emails };
      void persistEmailAction(id, "markUnread").catch((err) => {
        console.error("markUnread persistence failed", err);
      });
      return {
        emails: state.emails.map((e) =>
          e.id === id ? { ...e, isRead: false } : e
        ),
      };
    }),

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
