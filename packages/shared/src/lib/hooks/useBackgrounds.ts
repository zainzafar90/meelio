import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "../db/meelio.dexie";
import type { Background } from "../db/models.dexie";
import {
  getBackgrounds,
  getBackground,
  createBackground,
  updateBackground,
  deleteBackground,
} from "../../api/backgrounds.api";

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
      const response = await getBackgrounds();
      return response.data;
    },
  });
}

export function useBackground(id: string) {
  return useQuery({
    queryKey: BACKGROUND_KEYS.detail(id),
    queryFn: async () => {
      const response = await getBackground(id);
      return response.data;
    },
    enabled: !!id,
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
    mutationFn: async (data: {
      type: "static" | "live";
      url: string;
      metadata: {
        name: string;
        category: string;
        tags: string[];
        thumbnailUrl: string;
      };
    }) => {
      const response = await createBackground(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.lists() });
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
      const response = await updateBackground(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: BACKGROUND_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteBackground(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.detail(id) });
    },
  });
}
