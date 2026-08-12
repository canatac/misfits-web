/**
 * Filter/rule data hooks using TanStack Query + Zustand store.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFilterStore, testRule } from "@/stores/filter-store";
import type {
  Filter,
  FilterCreateInput,
  FilterUpdateInput,
} from "@/types/label";
import type { Email } from "@/types/email";

/** Query all filter rules from the store. */
export function useFilterRules() {
  return useQuery<Filter[]>({
    queryKey: ["filters"],
    queryFn: () => useFilterStore.getState().rules,
    staleTime: Infinity,
  });
}

/** Query a single rule by id. */
export function useFilterRule(id: string | null) {
  return useQuery<Filter | undefined>({
    queryKey: ["filters", id],
    queryFn: () => (id ? useFilterStore.getState().getRuleById(id) : undefined),
    enabled: !!id,
    staleTime: Infinity,
  });
}

/** Create a filter rule. */
export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation<Filter, Error, FilterCreateInput>({
    mutationFn: (input) => {
      const rule = useFilterStore.getState().createRule(input);
      return Promise.resolve(rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}

/** Update a filter rule. */
export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; input: FilterUpdateInput }>({
    mutationFn: ({ id, input }) => {
      useFilterStore.getState().updateRule(id, input);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}

/** Delete a filter rule. */
export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => {
      useFilterStore.getState().deleteRule(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}

/** Toggle a filter rule enabled/disabled. */
export function useToggleRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => {
      useFilterStore.getState().toggleRule(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}

/**
 * Test a rule against a set of emails and return the matches.
 * Uses the live store `testRule` so results stay consistent with the engine.
 */
export function useTestRule() {
  return useMutation<Email[], Error, { rule: Filter; emails: Email[] }>({
    mutationFn: ({ rule, emails }) => {
      const matches = testRule(rule, emails);
      return Promise.resolve(matches);
    },
  });
}

/** Import rules from a JSON string. Returns the count imported. */
export function useImportRules() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string>({
    mutationFn: (json) => {
      const count = useFilterStore.getState().importRules(json);
      return Promise.resolve(count);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filters"] });
    },
  });
}
