/**
 * Email data hooks using TanStack Query.
 * Same-origin `/api/emails` → email_api (Phase A5, #170).
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
import { mailAuthHeaders } from "@/lib/mail-api";
import { useEmailStore } from "@/stores/email-store";

async function fetchEmailList(query: EmailQuery): Promise<EmailListResponse> {
  const params = new URLSearchParams();
  if (query.folder) params.set("folder", query.folder);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.filterType) params.set("filter", query.filterType);
  if (query.searchQuery) params.set("q", query.searchQuery);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const res = await fetch(`/api/emails?${params.toString()}`, {
    headers: mailAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch emails: ${res.statusText}`);
  const data = await res.json();
  return {
    emails: data.emails ?? [],
    total: data.total ?? 0,
    page: data.page ?? query.page ?? 1,
    pageSize: data.pageSize ?? query.pageSize ?? 50,
    hasMore: Boolean(data.hasMore),
  };
}

async function fetchEmailById(id: string): Promise<Email | null> {
  const res = await fetch(`/api/emails/${encodeURIComponent(id)}`, {
    headers: mailAuthHeaders(),
    credentials: "include",
  });
  if (res.status === 404) return null;
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
 * Until flag endpoints exist server-side, update local email store optimistically.
 */
export function useEmailActions() {
  const queryClient = useQueryClient();
  const store = useEmailStore;

  const toggleStar = useMutation({
    mutationFn: async (id: string) => {
      store.getState().toggleStar(id);
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const markRead = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      if (isRead) store.getState().markRead(id);
      else store.getState().markUnread(id);
      return { id, isRead };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      store.getState().archive(id);
      return { id, folder: "archive" as Folder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      store.getState().deleteEmail(id);
      return { id };
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
      action: "archive" | "delete" | "markRead" | "markUnread" | "star" | "unstar";
    }) => {
      // Align with store BulkActionType using selected ids
      useEmailStore.setState({ selectedEmailIds: new Set(ids) });
      store.getState().bulkAction(action as never);
      return { ids, action };
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
 * Hook: useFolderCounts
 * Derives counts from the current email store only (no mock corpus).
 */
export function useFolderCounts() {
  return useQuery({
    queryKey: ["folder-counts"],
    queryFn: () => {
      const emails = useEmailStore.getState().emails;
      const folders: Folder[] = [
        "inbox",
        "sent",
        "drafts",
        "archive",
        "trash",
        "spam",
      ];
      return folders.map((f) => {
        const list = emails.filter((e) => e.folder === f);
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
