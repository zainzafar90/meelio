import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SearchEngineName = "Google" | "Bing" | "DuckDuckGo" | "Baidu" | "Yandex" | "Perplexity";

interface RecentSearch {
  query: string;
  engine: SearchEngineName;
  timestamp: number;
}

interface SearchState {
  selectedEngine: SearchEngineName;
  setSelectedEngine: (engine: SearchEngineName) => void;
  recentSearches: RecentSearch[];
  addRecentSearch: (query: string, engine: SearchEngineName) => void;
  clearRecentSearches: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      selectedEngine: "Google",
      setSelectedEngine: (engine) => set({ selectedEngine: engine }),
      recentSearches: [],
      addRecentSearch: (query: string, engine: SearchEngineName) => {
        const recentSearches = get().recentSearches;
        const newSearch: RecentSearch = {
          query: query.trim(),
          engine,
          timestamp: Date.now(),
        };

        const filtered = recentSearches.filter(
          (s) => !(s.query === newSearch.query && s.engine === newSearch.engine)
        );

        // Limit to 5 most recent searches (FIFO queue)
        const updated = [newSearch, ...filtered].slice(0, 5);

        set({ recentSearches: updated });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "meelio:local:search",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        selectedEngine: state.selectedEngine,
        recentSearches: state.recentSearches,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

