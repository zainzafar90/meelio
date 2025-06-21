import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";

import { Icons } from "../../../../components/icons/icons";
import { useDockStore } from "../../../../stores/dock.store";
import {
  useBackgroundStore,
  Wallpaper,
} from "../../../../stores/background.store";
import { useShallow } from "zustand/shallow";
import { useAppStore } from "../../../../stores";
import { useWallpaperSearch } from "../../../../hooks/use-wallpaper-search";
import { useDebouncedValue } from "../../../../hooks/use-debounced-value";
import { CurrentWallpaperDisplay } from "./current-wallpaper-display";
import { WallpaperTile } from "./wallpaper-tile";

export function BackgroundSelectorSheet() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, { delay: 300 });

  const { isBackgroundsVisible, toggleBackgrounds } = useDockStore(
    useShallow((state) => ({
      isBackgroundsVisible: state.isBackgroundsVisible,
      toggleBackgrounds: state.toggleBackgrounds,
    }))
  );
  const { setCurrentWallpaper, currentWallpaper } = useBackgroundStore(
    useShallow((state) => ({
      setCurrentWallpaper: state.setCurrentWallpaper,
      currentWallpaper: state.currentWallpaper,
    }))
  );
  const { wallpapers, resetToDefault } = useBackgroundStore(
    useShallow((state) => ({
      wallpapers: state.wallpapers,
      resetToDefault: state.resetToDefault,
    }))
  );

  const { setWallpaperRotationEnabled } = useAppStore(
    useShallow((state) => ({
      setWallpaperRotationEnabled: state.setWallpaperRotationEnabled,
    }))
  );

  const {
    filteredWallpapers,
    displayedWallpapers,
    totalCount,
    hasMore,
    setSearchQuery,
    loadMore,
  } = useWallpaperSearch({
    wallpapers,
    initialLimit: 24,
    loadMoreIncrement: 24,
  });

  // Update search query when debounced search changes
  React.useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const handleSetBackground = async (background: Wallpaper) => {
    setCurrentWallpaper(background);
    setWallpaperRotationEnabled(false);
  };

  const handleRandomBackground = () => {
    // Use all wallpapers for random selection, not just displayed ones
    const randomIndex = Math.floor(Math.random() * wallpapers.length);
    const randomWallpaper = wallpapers[randomIndex];
    setCurrentWallpaper(randomWallpaper);
    setWallpaperRotationEnabled(false);
  };

  const handleResetToDefault = () => {
    resetToDefault();
    setWallpaperRotationEnabled(true);
  };

  return (
    <Sheet open={isBackgroundsVisible} onOpenChange={toggleBackgrounds}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-hidden flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>{t("backgrounds.title")}</SheetTitle>
          <SheetDescription>{t("backgrounds.description")}</SheetDescription>
        </SheetHeader>

        {/* Current Wallpaper Display */}
        {currentWallpaper && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-white/70 mb-2">
              {t("backgrounds.currentWallpaper", "Current Wallpaper")}
            </h3>
            <CurrentWallpaperDisplay wallpaper={currentWallpaper} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleRandomBackground}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t("backgrounds.randomBackground")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleResetToDefault}
          >
            <Icons.reset className="mr-1.5 h-3.5 w-3.5" />
            {t("backgrounds.resetToDefault")}
          </Button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            type="text"
            placeholder={t(
              "backgrounds.searchPlaceholder",
              "Search wallpapers..."
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
          />
        </div>

        {/* Wallpapers Grid */}
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 mt-4">
          {totalCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70">
                  {searchInput.trim()
                    ? t("backgrounds.searchResults", "Search Results")
                    : t("backgrounds.allWallpapers", "All Wallpapers")}
                </h3>
                <span className="text-xs text-white/50">
                  Showing {displayedWallpapers.length} of {totalCount}{" "}
                  wallpapers
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {displayedWallpapers.map((wallpaper) => (
                  <WallpaperTile
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    isSelected={currentWallpaper?.id === wallpaper.id}
                    onSelect={handleSetBackground}
                    size="small"
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4 pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  >
                    Load More ({totalCount - displayedWallpapers.length}{" "}
                    remaining)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-white/30 mb-4" />
              <p className="text-sm text-white/70 mb-2">
                {t("backgrounds.noResults", "No wallpapers found")}
              </p>
              <p className="text-xs text-white/50">
                {t(
                  "backgrounds.tryDifferentSearch",
                  "Try a different search term"
                )}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
