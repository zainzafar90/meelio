import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAppLauncherStore } from "../../../stores/app-launcher.store";
import { PinnedAppsGrid } from "./pinned-apps-grid";
import { WeatherWidget } from "./weather-widget";
import { MediaWidget } from "./media-widget";
import { ProfileFooter } from "./profile-footer";
import { Search, X } from "lucide-react";

export const AppLauncher = () => {
  const { isVisible, close, searchQuery, setSearchQuery, clearSearch } =
    useAppLauncherStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, close]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 h-full w-full z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md overflow-auto p-4"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-4xl flex-col max-h-[90vh] overflow-y-auto rounded-2xl border bg-card/95 shadow-[0_8px_32px_0_hsl(var(--background)/0.4)] backdrop-blur-3xl"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(120, 119, 198, 0.1), transparent 50%)",
          }}
        >
          <div className="flex items-center justify-between p-8">
            <div className="relative hidden md:block w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border bg-muted/30 py-4 pl-9 pr-9 text-sm text-card-foreground placeholder:text-muted-foreground backdrop-blur-xl transition-all focus:border-accent focus:bg-muted/50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-card-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <PinnedAppsGrid
            searchQuery={searchQuery}
            onAppClick={() => close()}
          />

          <div className="bg-muted/20 border-t p-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <WeatherWidget />
              <MediaWidget />
            </div>
          </div>

          <ProfileFooter onClose={close} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
