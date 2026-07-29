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
import { mockFolders, mockLabels, mockEmails } from "@/lib/mock-emails";

export type BulkActionType = "archive" | "delete" | "markRead" | "markUnread" | "star" | "unstar";

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
  fetchEmails: (folder?: Folder) => void;
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

function sortEmails(emails: Email[], sortBy: SortBy): Email[] {
  const sorted = [...emails];
  switch (sortBy) {
    case "date":
      return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    case "sender":
      return sorted.sort((a, b) => a.from.name.localeCompare(b.from.name));
    case "subject":
      return sorted.sort((a, b) => a.subject.localeCompare(b.subject));
    case "size":
      return sorted.sort((a, b) => b.size - a.size);
    case "unreadFirst":
      return sorted.sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.isRead ? 1 : -1;
      });
    default:
      return sorted;
  }
}

function filterEmails(
  emails: Email[],
  filterType: FilterType,
  searchQuery: string,
  accountId: string | null,
): Email[] {
  let result = emails;
  // Account filter (Issue #154): null = unified (all accounts). Untagged emails
  // (no accountId) are shown in every account's view so legacy mock data stays visible.
  if (accountId !== null) {
    result = result.filter((e) => e.accountId === undefined || e.accountId === accountId);
  }
  switch (filterType) {
    case "unread":
      result = result.filter((e) => !e.isRead);
      break;
    case "starred":
      result = result.filter((e) => e.isStarred);
      break;
    case "attachments":
      result = result.filter((e) => e.hasAttachments);
      break;
    case "all":
    default:
      break;
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.name.toLowerCase().includes(q) ||
        e.from.address.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q),
    );
  }
  return result;
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

  fetchEmails: (folder) => {
    const targetFolder = folder ?? get().currentFolder;
    set({ loading: true, error: null });
    try {
      const folderEmails = mockEmails.filter((e) => e.folder === targetFolder);
      set({
        emails: folderEmails,
        loading: false,
        currentFolder: targetFolder,
        selectedEmailId: null,
        selectedEmailIds: new Set(),
      });
    } catch {
      set({ loading: false, error: "Failed to fetch emails" });
    }
  },

  selectEmail: (id) => {
    set({ selectedEmailId: id });
    if (id) {
      const email = get().emails.find((e) => e.id === id);
      if (email && !email.isRead) {
        set((state) => ({
          emails: state.emails.map((e) =>
            e.id === id ? { ...e, isRead: true } : e,
          ),
        }));
      }
    }
  },

  toggleStar: (id) => {
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isStarred: !e.isStarred } : e,
      ),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isRead: true } : e,
      ),
    }));
  },

  markUnread: (id) => {
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, isRead: false } : e,
      ),
    }));
  },

  archive: (id) => {
    set((state) => ({
      emails: state.emails.map((e) =>
        e.id === id ? { ...e, folder: "archive" as Folder } : e,
      ),
      selectedEmailId: state.selectedEmailId === id ? null : state.selectedEmailId,
    }));
    // Re-filter to remove archived email from current view
    const { currentFolder } = get();
    set((state) => ({
      emails: state.emails.filter((e) => e.folder === currentFolder || e.id !== id),
    }));
  },

  deleteEmail: (id) => {
    set((state) => ({
      emails: state.emails.filter((e) => e.id !== id),
      selectedEmailId: state.selectedEmailId === id ? null : state.selectedEmailId,
      selectedEmailIds: (() => {
        const next = new Set(state.selectedEmailIds);
        next.delete(id);
        return next;
      })(),
    }));
  },

  bulkAction: (action) => {
    const ids = get().selectedEmailIds;
    if (ids.size === 0) return;
    set((state) => ({
      emails: state.emails.map((e) => {
        if (!ids.has(e.id)) return e;
        switch (action) {
          case "archive":
            return { ...e, folder: "archive" as Folder };
          case "delete":
            return null;
          case "markRead":
            return { ...e, isRead: true };
          case "markUnread":
            return { ...e, isRead: false };
          case "star":
            return { ...e, isStarred: true };
          case "unstar":
            return { ...e, isStarred: false };
          default:
            return e;
        }
      }).filter((e): e is Email => e !== null),
      selectedEmailIds: new Set(),
    }));
    // Re-filter current folder
    const { currentFolder } = get();
    set((state) => ({
      emails: state.emails.filter((e) => e.folder === currentFolder),
    }));
  },

  setFolder: (folder) => {
    set({ currentFolder: folder, selectedEmailId: null, selectedEmailIds: new Set() });
    get().fetchEmails(folder);
  },

  setSortBy: (sortBy) => set({ sortBy }),

  setFilterType: (filterType) => set({ filterType, selectedEmailIds: new Set() }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setAccountId: (accountId) => {
    // No-op when unchanged — avoids thrashing subscribers (new Set() each call).
    if (get().accountId === accountId) return;
    set({ accountId, selectedEmailId: null, selectedEmailIds: new Set() });
  },

  toggleEmailSelection: (id) => {
    set((state) => {
      const next = new Set(state.selectedEmailIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
