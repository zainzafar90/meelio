import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useSetSelectedBackground } from "./useBackgrounds";

export * from "./useBackgrounds";

/**
 * Hook to get a random background
 * @returns {object} The mutation object for getting a random background
 */
export const useRandomBackground = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.get("/api/v1/backgrounds/random");
      return response.data;
    },
    onSuccess: (data) => {
      // After getting a random background, set it as selected
      useSetSelectedBackground().mutate(data.id);

      // Invalidate backgrounds query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["backgrounds"] });
    },
  });
};
