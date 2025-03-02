import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SiteBlocker } from "../db/models.dexie";
import { siteBlockerRepository } from "../repositories";

const SITE_BLOCKERS_QUERY_KEY = "site-blockers";

export function useSiteBlockers() {
  return useQuery({
    queryKey: [SITE_BLOCKERS_QUERY_KEY],
    queryFn: () => siteBlockerRepository.getAll(),
  });
}

export function useSiteBlocker(id: string) {
  return useQuery({
    queryKey: [SITE_BLOCKERS_QUERY_KEY, id],
    queryFn: () => siteBlockerRepository.getById(id),
  });
}

export function useCreateSiteBlocker() {
  const queryClient = useQueryClient();

  return useMutation<
    SiteBlocker,
    Error,
    Omit<
      SiteBlocker,
      | "id"
      | "_syncStatus"
      | "_lastModified"
      | "_version"
      | "createdAt"
      | "updatedAt"
    >
  >({
    mutationFn: (data) => siteBlockerRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_BLOCKERS_QUERY_KEY] });
    },
  });
}

export function useUpdateSiteBlocker() {
  const queryClient = useQueryClient();

  return useMutation<
    SiteBlocker,
    Error,
    { id: string; data: Partial<SiteBlocker> }
  >({
    mutationFn: ({ id, data }) => siteBlockerRepository.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SITE_BLOCKERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SITE_BLOCKERS_QUERY_KEY, variables.id],
      });
    },
  });
}

export function useDeleteSiteBlocker() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => siteBlockerRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [SITE_BLOCKERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SITE_BLOCKERS_QUERY_KEY, id],
      });
    },
  });
}
