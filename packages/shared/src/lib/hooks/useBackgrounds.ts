import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "../db/meelio.dexie";
import { getBackgrounds } from "../../api/backgrounds.api";

const BACKGROUND_KEYS = {
  all: ["backgrounds"] as const,
  lists: () => [...BACKGROUND_KEYS.all, "list"] as const,
  list: (filters: string) => [...BACKGROUND_KEYS.lists(), { filters }] as const,
  details: () => [...BACKGROUND_KEYS.all, "detail"] as const,
  detail: (id: string) => [...BACKGROUND_KEYS.details(), id] as const,
  favourite: () => [...BACKGROUND_KEYS.all, "favourite"] as const,
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

export function useSetFavouriteBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backgroundId: string) => {
      await db.setFavouriteBackground(backgroundId);
      return backgroundId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_KEYS.favourite() });
    },
  });
}
