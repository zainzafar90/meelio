import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Clock, X } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { Dialog, DialogContent } from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { useSearchStore, type SearchEngineName } from "../../../stores/search.store";

export interface SearchEngine {
  name: string;
  url: string;
  icon: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    name: "Google",
    url: "https://www.google.com/search?q=%s",
    icon: "https://www.google.com/s2/favicons?domain=google.com&sz=64",
  },
  {
    name: "Perplexity",
    url: "https://www.perplexity.ai/search?q=%s",
    icon: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64",
  },
  {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=%s",
    icon: "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=64",
  },
  {
    name: "Bing",
    url: "https://www.bing.com/search?q=%s",
    icon: "https://www.google.com/s2/favicons?domain=bing.com&sz=64",
  },
  {
    name: "Baidu",
    url: "https://www.baidu.com/s?wd=%s",
    icon: "https://www.google.com/s2/favicons?domain=baidu.com&sz=64",
  },
  {
    name: "Yandex",
    url: "https://yandex.com/search/?text=%s",
    icon: "https://www.google.com/s2/favicons?domain=yandex.com&sz=64",
  },

];

type EngineIconProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
};

const EngineIcon = ({ src, alt, size = 16, className }: EngineIconProps) => {
  const [error, setError] = useState(false);
  const style = { width: size, height: size } as const;
  return error ? (
    <div className={cn("inline-flex items-center justify-center rounded bg-white/10 text-white/80", className)} style={style}>
      {alt.charAt(0)}
    </div>
  ) : (
    <img src={src} alt={alt} onError={() => setError(true)} className={cn(className)} style={style} />
  );
};

export const SearchPopover = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedEngine, setSelectedEngine, recentSearches, addRecentSearch, clearRecentSearches } =
    useSearchStore(
      useShallow((state) => ({
        selectedEngine: state.selectedEngine,
        setSelectedEngine: state.setSelectedEngine,
        recentSearches: state.recentSearches,
        addRecentSearch: state.addRecentSearch,
        clearRecentSearches: state.clearRecentSearches,
      }))
    );

  const engine = selectedEngine;

  const filteredRecentSearches = recentSearches.filter((search) =>
    search.query.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selected index when filtered searches change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredRecentSearches.length, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isMod = isMac ? e.metaKey : e.ctrlKey;

      if (isMod && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSearch = (searchQuery?: string) => {
    const queryToSearch = searchQuery || query.trim();
    if (!queryToSearch) return;

    const selectedEngineConfig = SEARCH_ENGINES.find((e) => e.name === engine);
    if (!selectedEngineConfig) return;

    addRecentSearch(queryToSearch, engine);

    const searchUrl = selectedEngineConfig.url.replace(
      "%s",
      encodeURIComponent(queryToSearch)
    );
    window.open(searchUrl, "_blank", "noopener,noreferrer");
    setQuery("");
    setOpen(false);
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    handleSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If a recent search is selected, use it
      if (selectedIndex >= 0 && selectedIndex < filteredRecentSearches.length) {
        handleSearch(filteredRecentSearches[selectedIndex].query);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        if (filteredRecentSearches.length === 0) return -1;
        return prev < filteredRecentSearches.length - 1 ? prev + 1 : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    }
  };

  const selectedEngineConfig = SEARCH_ENGINES.find((e) => e.name === engine);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl bg-gray-900/80 backdrop-blur border-white/10 p-0"
        showClose={false}
      >
        <div className="flex flex-col">
          <div className="relative border-b border-white/10">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search the web..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 pl-11 pr-4 bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
              role="combobox"
              aria-expanded={!query && filteredRecentSearches.length > 0}
              aria-controls="recent-searches-list"
              aria-activedescendant={
                selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined
              }
              aria-label="Search the web"
            />
          </div>

          <div className="divide-y divide-white/10">
            {query ? null : (
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between px-3">
                  <h2 className="text-xs font-semibold text-gray-200">
                    Recent searches
                  </h2>
                  {filteredRecentSearches.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                {filteredRecentSearches.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto" id="recent-searches-list" role="listbox" aria-label="Recent searches">
                    {filteredRecentSearches.map((search, index) => (
                      <li
                        key={index}
                        id={`search-item-${index}`}
                        role="option"
                        aria-selected={selectedIndex === index}
                        className={cn(
                          "group flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white",
                          selectedIndex === index && "bg-white/10 text-white"
                        )}
                        onClick={() => handleRecentSearchClick(search.query)}
                      >
                        <Clock className={cn(
                          "size-5 flex-none text-gray-500 group-hover:text-white",
                          selectedIndex === index && "text-white"
                        )} />
                        <EngineIcon
                          src={
                            SEARCH_ENGINES.find((e) => e.name === search.engine)
                              ?.icon as string
                          }
                          alt={search.engine}
                          size={16}
                          className="ml-3 flex-none rounded"
                        />
                        <span className="ml-3 flex-auto truncate">
                          {search.query}
                        </span>
                        <span className={cn(
                          "ml-3 flex-none text-gray-400",
                          selectedIndex === index ? "inline" : "hidden group-hover:inline"
                        )}>
                          Search with {search.engine}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 text-sm text-gray-400">
                    No recent searches
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 bg-gray-800/50 px-4 py-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span>Press</span>
                <kbd className="flex size-5 items-center justify-center rounded border border-white/10 bg-gray-800 font-semibold text-white">
                  {navigator.platform.toUpperCase().indexOf("MAC") >= 0
                    ? "⌘"
                    : "Ctrl"}
                </kbd>
                <span>+</span>
                <kbd className="flex size-5 items-center justify-center rounded border border-white/10 bg-gray-800 font-semibold text-white">
                  K
                </kbd>
                <span>to open,</span>
                <kbd className="flex items-center justify-center rounded border border-white/10 bg-gray-800 px-1.5 py-0.5 font-semibold text-white">
                  Enter
                </kbd>
                <span>to search</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400">Search with:</span>
                <Select
                  value={engine}
                  onValueChange={(value) =>
                    setSelectedEngine(value as SearchEngineName)
                  }
                >
                  <SelectTrigger
                    className="h-7 w-auto gap-1.5 border-0 bg-transparent px-2 hover:bg-white/5 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-white/5"
                    aria-label="Select search engine"
                  >
                    <SelectValue>
                      {selectedEngineConfig && (
                        <div className="flex items-center gap-1.5">
                          <EngineIcon src={selectedEngineConfig.icon} alt={selectedEngineConfig.name} size={16} className="rounded flex-shrink-0" />
                          <span className="text-white font-medium">{selectedEngineConfig.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    {SEARCH_ENGINES.map((searchEngine) => (
                      <SelectItem
                        key={searchEngine.name}
                        value={searchEngine.name}
                        className="text-white hover:bg-white/5 focus:bg-white/5 data-[highlighted]:bg-white/5 data-[highlighted]:text-white"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <EngineIcon src={searchEngine.icon} alt={searchEngine.name} size={16} className="rounded" />
                          <span>{searchEngine.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
