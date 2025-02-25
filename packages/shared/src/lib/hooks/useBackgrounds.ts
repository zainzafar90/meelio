import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "../db";
import type { Background } from "../db/models";

const BACKGROUND_KEYS = {
  all: ["backgrounds"] as const,
  lists: () => [...BACKGROUND_KEYS.all, "list"] as const,
  list: (filters: string) => [...BACKGROUND_KEYS.lists(), { filters }] as const,
  details: () => [...BACKGROUND_KEYS.all, "detail"] as const,
  detail: (id: string) => [...BACKGROUND_KEYS.details(), id] as const,
  selected: () => [...BACKGROUND_KEYS.all, "selected"] as const,
};

export function useBackgrounds(userId: string) {
  return useQuery({
    queryKey: BACKGROUND_KEYS.list(userId),
    queryFn: async () => {
      const response = await fetch(`/api/backgrounds?userId=${userId}`);
      return response.json();
    },
  });
}

export function useBackground(id: string, userId: string) {
  return useQuery({
    queryKey: BACKGROUND_KEYS.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/backgrounds/${id}?userId=${userId}`);
      return response.json();
    },
  });
}

export function useSelectedBackground() {
  return useQuery({
    queryKey: BACKGROUND_KEYS.selected(),
    queryFn: async () => {
      return db.getSelectedBackground();
    },
  });
}

export function useSetSelectedBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backgroundId: string) => {
      await db.setSelectedBackground(backgroundId);
      return backgroundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.selected() });
    },
  });
}

export function useCreateBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Background, "id">) => {
      const response = await fetch("/api/backgrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BACKGROUND_KEYS.list(variables.userId),
      });
    },
  });
}

export function useUpdateBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Background>;
    }) => {
      const response = await fetch(`/api/backgrounds/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BACKGROUND_KEYS.list(variables.data.userId),
      });
      queryClient.invalidateQueries({
        queryKey: BACKGROUND_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const response = await fetch(`/api/backgrounds/${id}?userId=${userId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: BACKGROUND_KEYS.list(variables.userId),
      });
    },
  });
}
