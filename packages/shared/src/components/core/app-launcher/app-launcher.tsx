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
        className="fixed inset-0 h-full w-full z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md overflow-auto p-4"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-4xl flex-col max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/40 via-zinc-900/50 to-black/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-3xl"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(120, 119, 198, 0.1), transparent 50%)",
          }}
        >
          <div className="flex items-center justify-between p-8">
            <div className="relative hidden md:block w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-4 pl-9 pr-9 text-sm text-white placeholder:text-white/50 backdrop-blur-xl transition-all focus:border-white/20 focus:bg-white/10 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
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

          <div className="bg-zinc-900/50 border-t border-white/5 p-8">
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
