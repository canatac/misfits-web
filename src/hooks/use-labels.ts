/**
 * Label data hooks using TanStack Query + Zustand store.
 * useLabels queries the store (with query caching) and the mutations
 * wrap the store actions, invalidating the cache on success.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useLabelStore } from "@/stores/label-store";
import type { Label, LabelCreateInput, LabelUpdateInput, LabelTree } from "@/types/label";

/** Query all labels from the store. */
export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ["labels"],
    queryFn: () => useLabelStore.getState().labels,
    staleTime: Infinity,
  });
}

/** Query the hierarchical label tree from the store. */
export function useLabelTree() {
  return useQuery<LabelTree[]>({
    queryKey: ["labels", "tree"],
    queryFn: () => useLabelStore.getState().getLabelTree(),
    staleTime: Infinity,
  });
}

/** Query labels assigned to a specific email. */
export function useEmailLabels(emailId: string | null) {
  return useQuery<Label[]>({
    queryKey: ["labels", "email", emailId],
    queryFn: () =>
      emailId ? useLabelStore.getState().getLabelsForEmail(emailId) : [],
    enabled: !!emailId,
    staleTime: Infinity,
  });
}

/** Create a label. */
export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation<Label, Error, LabelCreateInput>({
    mutationFn: (input) => {
      const label = useLabelStore.getState().createLabel(input);
      return Promise.resolve(label);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

/** Update a label. */
export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; input: LabelUpdateInput }>({
    mutationFn: ({ id, input }) => {
      useLabelStore.getState().updateLabel(id, input);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

/** Delete a label. */
export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => {
      useLabelStore.getState().deleteLabel(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

/** Assign a label to an email. */
export function useAssignLabel() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { emailId: string; labelId: string }>({
    mutationFn: ({ emailId, labelId }) => {
      useLabelStore.getState().assignLabelToEmail(emailId, labelId);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}

/** Remove a label from an email. */
export function useRemoveLabel() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { emailId: string; labelId: string }>({
    mutationFn: ({ emailId, labelId }) => {
      useLabelStore.getState().removeLabelFromEmail(emailId, labelId);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
  });
}
