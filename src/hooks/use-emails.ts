/**
 * Email data hooks using TanStack Query.
 * Falls back to mock data when no backend is available.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type {
  Email,
  EmailListResponse,
  EmailQuery,
  Folder,
} from "@/types/email";
import { mockEmails, getMockEmailById, getMockEmailsByFolder } from "@/lib/mock-emails";

/**
 * Check if a backend is available at runtime.
 * In dev without BACKEND_URL, we use mock data.
 */
const BACKEND_AVAILABLE =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_BACKEND_URL;

async function fetchEmailList(query: EmailQuery): Promise<EmailListResponse> {
  if (!BACKEND_AVAILABLE) {
    // Mock fallback
    let emails = getMockEmailsByFolder(query.folder ?? "inbox");

    // Apply filter
    if (query.filterType === "unread") {
      emails = emails.filter((e) => !e.isRead);
    } else if (query.filterType === "starred") {
      emails = emails.filter((e) => e.isStarred);
    } else if (query.filterType === "attachments") {
      emails = emails.filter((e) => e.hasAttachments);
    }

    // Apply search
    if (query.searchQuery?.trim()) {
      const q = query.searchQuery.toLowerCase();
      emails = emails.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q),
      );
    }

    // Apply sort
    switch (query.sortBy) {
      case "sender":
        emails = [...emails].sort((a, b) => a.from.name.localeCompare(b.from.name));
        break;
      case "subject":
        emails = [...emails].sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case "size":
        emails = [...emails].sort((a, b) => b.size - a.size);
        break;
      case "unreadFirst":
        emails = [...emails].sort((a, b) => {
          if (a.isRead === b.isRead)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          return a.isRead ? 1 : -1;
        });
        break;
      case "date":
      default:
        emails = [...emails].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    const paged = emails.slice(start, start + pageSize);

    return {
      emails: paged,
      total: emails.length,
      page,
      pageSize,
      hasMore: start + pageSize < emails.length,
    };
  }

  const params = new URLSearchParams();
  if (query.folder) params.set("folder", query.folder);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.filterType) params.set("filter", query.filterType);
  if (query.searchQuery) params.set("q", query.searchQuery);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const res = await fetch(`/api/emails?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch emails: ${res.statusText}`);
  return res.json();
}

async function fetchEmailById(id: string): Promise<Email | null> {
  if (!BACKEND_AVAILABLE) {
    return getMockEmailById(id) ?? null;
  }
  const res = await fetch(`/api/emails/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch email: ${res.statusText}`);
  return res.json();
}

/**
 * Hook: useEmailList
 * Fetches emails by folder with TanStack Query, supporting filter, sort, search.
 */
export function useEmailList(query: EmailQuery) {
  return useQuery({
    queryKey: ["emails", query],
    queryFn: () => fetchEmailList(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Hook: useEmail
 * Fetches a single email by ID.
 */
export function useEmail(id: string | null) {
  return useQuery({
    queryKey: ["email", id],
    queryFn: () => fetchEmailById(id!),
    enabled: !!id,
  });
}

/**
 * Hook: useEmailActions
 * Mutations for star, read, archive, delete, bulk actions.
 * Optimistically updates the TanStack Query cache.
 */
export function useEmailActions() {
  const queryClient = useQueryClient();

  const toggleStar = useMutation({
    mutationFn: async (id: string) => {
      if (!BACKEND_AVAILABLE) {
        const email = getMockEmailById(id);
        return email ? { ...email, isStarred: !email.isStarred } : null;
      }
      const res = await fetch(`/api/emails/${id}/star`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle star");
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["email", updated?.id], updated);
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      if (!BACKEND_AVAILABLE) {
        const email = getMockEmailById(id);
        return email ? { ...email, isRead } : null;
      }
      const res = await fetch(`/api/emails/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      if (!res.ok) throw new Error("Failed to mark email");
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["email", updated?.id], updated);
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      if (!BACKEND_AVAILABLE) return { id, folder: "archive" as Folder };
      const res = await fetch(`/api/emails/${id}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to archive email");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      if (!BACKEND_AVAILABLE) return { id };
      const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete email");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const bulkAction = useMutation({
    mutationFn: async ({
      ids,
      action,
    }: {
      ids: string[];
      action: "archive" | "delete" | "markRead" | "markUnread";
    }) => {
      if (!BACKEND_AVAILABLE) return { ids, action };
      const res = await fetch(`/api/emails/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error("Failed to bulk action");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  return {
    toggleStar,
    markRead,
    archive,
    deleteEmail,
    bulkAction,
  };
}

/**
 * Hook: useMockEmailCount
 * Returns unread counts per folder (for sidebar badges).
 */
export function useFolderCounts() {
  return useQuery({
    queryKey: ["folder-counts"],
    queryFn: () => {
      const folders: Folder[] = ["inbox", "sent", "drafts", "archive", "trash", "spam"];
      return folders.map((f) => {
        const list = mockEmails.filter((e) => e.folder === f);
        return {
          folder: f,
          total: list.length,
          unread: list.filter((e) => !e.isRead).length,
        };
      });
    },
    staleTime: 60_000,
  });
}
