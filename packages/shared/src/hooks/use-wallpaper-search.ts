import { useCallback, useMemo, useState } from "react";
import type { Wallpaper } from "../stores/background.store";

interface WallpaperSearchConfig {
  wallpapers: Wallpaper[];
  initialLimit?: number;
  loadMoreIncrement?: number;
}

interface WallpaperSearchResult {
  searchQuery: string;
  filteredWallpapers: Wallpaper[];
  displayedWallpapers: Wallpaper[];
  totalCount: number;
  hasMore: boolean;
  setSearchQuery: (query: string) => void;
  loadMore: () => void;
  reset: () => void;
}

export function useWallpaperSearch({
  wallpapers,
  initialLimit = 24,
  loadMoreIncrement = 24,
}: WallpaperSearchConfig): WallpaperSearchResult {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

  const filteredWallpapers = useMemo(() => {
    if (!searchQuery.trim()) return wallpapers;
    
    const query = searchQuery.toLowerCase().trim();
    return wallpapers.filter(
      (wallpaper) =>
        wallpaper.title.toLowerCase().includes(query) ||
        wallpaper.author.toLowerCase().includes(query)
    );
  }, [wallpapers, searchQuery]);

  const displayedWallpapers = useMemo(() => {
    return filteredWallpapers.slice(0, displayLimit);
  }, [filteredWallpapers, displayLimit]);

  const hasMore = useMemo(() => {
    return displayLimit < filteredWallpapers.length;
  }, [displayLimit, filteredWallpapers.length]);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setDisplayLimit(initialLimit);
  }, [initialLimit]);

  const loadMore = useCallback(() => {
    setDisplayLimit(prevLimit => prevLimit + loadMoreIncrement);
  }, [loadMoreIncrement]);

  const reset = useCallback(() => {
    setDisplayLimit(initialLimit);
  }, [initialLimit]);

  return {
    searchQuery,
    filteredWallpapers,
    displayedWallpapers,
    totalCount: filteredWallpapers.length,
    hasMore,
    setSearchQuery: handleSetSearchQuery,
    loadMore,
    reset,
  };
}