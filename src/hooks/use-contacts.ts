/**
 * Contact data hooks (Issue #152).
 *
 * Wrap the Zustand contact store with TanStack Query for caching + cache
 * invalidation, plus a debounced search hook for the contacts page.
 */
import { useMemo, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useContactStore } from "@/stores/contact-store";
import type {
  Contact,
  ContactGroup,
  ContactGroupInput,
  ContactImport,
  ContactInput,
  DuplicatePair,
} from "@/types/contact";

/** Query all contacts from the store. */
export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: () => useContactStore.getState().contacts,
    staleTime: Infinity,
  });
}

/** Query all groups from the store. */
export function useContactGroups() {
  return useQuery<ContactGroup[]>({
    queryKey: ["contacts", "groups"],
    queryFn: () => useContactStore.getState().groups,
    staleTime: Infinity,
  });
}

/** Query a single contact by id. */
export function useContact(id: string | null) {
  return useQuery<Contact | undefined>({
    queryKey: ["contacts", id],
    queryFn: () => (id ? useContactStore.getState().getContactById(id) : undefined),
    enabled: !!id,
    staleTime: Infinity,
  });
}

/** Query duplicate contact suggestions. */
export function useDuplicateContacts() {
  return useQuery<DuplicatePair[]>({
    queryKey: ["contacts", "duplicates"],
    queryFn: () => useContactStore.getState().findDuplicates(),
    staleTime: Infinity,
  });
}

/**
 * Debounced search over contacts. Returns the filtered list and the raw
 * query string. 200ms debounce keeps the list responsive without thrashing.
 */
export function useSearchContacts(initial = "") {
  const [query, setQuery] = useState(initial);
  const [debounced, setDebounced] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => useContactStore.getState().searchContacts(debounced),
    // Re-run whenever the store contacts change OR the debounce fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debounced, useContactStore.getState().contacts],
  );

  return { query, setQuery, results };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                         */
/* ------------------------------------------------------------------ */

/** Add / update / delete / merge contacts. Invalidates the contacts cache. */
export function useContactMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  };

  const addContact = useMutation<Contact, Error, ContactInput>({
    mutationFn: (input) => Promise.resolve(useContactStore.getState().addContact(input)),
    onSuccess: invalidate,
  });

  const updateContact = useMutation<void, Error, { id: string; input: Partial<ContactInput> }>({
    mutationFn: ({ id, input }) => {
      useContactStore.getState().updateContact(id, input);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const deleteContact = useMutation<void, Error, string>({
    mutationFn: (id) => {
      useContactStore.getState().deleteContact(id);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const mergeContacts = useMutation<void, Error, { primaryId: string; duplicateId: string }>({
    mutationFn: ({ primaryId, duplicateId }) => {
      useContactStore.getState().mergeContacts(primaryId, duplicateId);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const importContacts = useMutation<number, Error, ContactImport[]>({
    mutationFn: (imports) => Promise.resolve(useContactStore.getState().importContacts(imports)),
    onSuccess: invalidate,
  });

  return { addContact, updateContact, deleteContact, mergeContacts, importContacts };
}

/** Group CRUD mutations. */
export function useContactGroupMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contacts", "groups"] });

  const addGroup = useMutation<ContactGroup, Error, ContactGroupInput>({
    mutationFn: (input) => Promise.resolve(useContactStore.getState().addGroup(input)),
    onSuccess: invalidate,
  });

  const updateGroup = useMutation<void, Error, { id: string; input: Partial<ContactGroupInput> }>({
    mutationFn: ({ id, input }) => {
      useContactStore.getState().updateGroup(id, input);
      return Promise.resolve();
    },
    onSuccess: invalidate,
  });

  const deleteGroup = useMutation<void, Error, string>({
    mutationFn: (id) => {
      useContactStore.getState().deleteGroup(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return { addGroup, updateGroup, deleteGroup };
}
