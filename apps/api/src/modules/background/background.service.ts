export const backgroundService = {
  /** Set a background as favourite for a user */
  setFavouriteBackground: async (userId: string, backgroundId: string) => {
    return {
      userId,
      backgroundId,
      success: true,
    };
  },
};
