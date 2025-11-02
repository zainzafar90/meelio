import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { CachedBookmark } from "../lib/db/models.dexie";
import { useAuthStore } from "./auth.store";
import type { BookmarkNode, BookmarkLink, BookmarkFolder } from "../types/bookmarks.types";
import { generateUUID } from "../utils/common.utils";

interface BookmarksState {
    bookmarks: BookmarkNode[];
    folders: BookmarkFolder[];
    links: BookmarkLink[];
    hasPermissions: boolean;
    isLoading: boolean;
    error: string | null;
    lastSyncAt: number | null;
    _hasHydrated: boolean;

    initializeStore: () => Promise<void>;
    loadFromLocal: () => Promise<void>;
    syncFromChrome: () => Promise<void>;

    checkPermissions: () => Promise<boolean>;
    requestPermissions: () => Promise<boolean>;
    refreshBookmarks: () => Promise<void>;

    addBookmark: (bookmark: Omit<BookmarkLink, "id">) => Promise<void>;
    updateBookmark: (id: string, updates: Partial<BookmarkLink>) => Promise<void>;
    deleteBookmark: (id: string) => Promise<void>;

    addFolder: (folder: Omit<BookmarkFolder, "id" | "children">) => Promise<void>;
    updateFolder: (id: string, updates: Partial<BookmarkFolder>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;

    setHasHydrated: (state: boolean) => void;
}

const CHROME_BOOKMARKS_ROOT = "0";
const CACHE_DURATION = 60 * 60 * 1000;

const isExtension = typeof chrome !== "undefined" && !!chrome.storage;

const mapChromeBookmark = (node: chrome.bookmarks.BookmarkTreeNode): BookmarkNode => ({
    id: node.id,
    title: node.title || "",
    url: node.url,
    parentId: node.parentId,
    index: node.index,
    dateAdded: node.dateAdded,
    dateGroupModified: node.dateGroupModified,
    children: node.children?.map(mapChromeBookmark),
});

const flattenBookmarks = (nodes: BookmarkNode[]): Array<BookmarkNode & { level: number }> => {
    const result: Array<BookmarkNode & { level: number }> = [];

    const traverse = (nodeList: BookmarkNode[], level = 0) => {
        nodeList.forEach((node) => {
            result.push({ ...node, level });
            if (node.children) {
                traverse(node.children, level + 1);
            }
        });
    };

    traverse(nodes);
    return result;
};

const buildTree = (flat: Array<BookmarkNode & { level: number }>): BookmarkNode[] => {
    const tree: BookmarkNode[] = [];
    const stack: Array<{ node: BookmarkNode; level: number }> = [];

    flat.forEach((item) => {
        const node: BookmarkNode = {
            id: item.id,
            title: item.title,
            url: item.url,
            parentId: item.parentId,
            index: item.index,
            dateAdded: item.dateAdded,
            dateGroupModified: item.dateGroupModified,
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
            stack.pop();
        }

        if (stack.length === 0) {
            tree.push(node);
        } else {
            const parent = stack[stack.length - 1].node;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(node);
        }

        stack.push({ node, level: item.level });
    });

    return tree;
};

const separateFoldersAndLinks = (nodes: BookmarkNode[]): { folders: BookmarkFolder[]; links: BookmarkLink[] } => {
    const folders: BookmarkFolder[] = [];
    const links: BookmarkLink[] = [];

    const traverse = (nodeList: BookmarkNode[]) => {
        nodeList.forEach((node) => {
            if (node.url) {
                links.push({
                    id: node.id,
                    title: node.title,
                    url: node.url,
                    favicon: undefined,
                    parentId: node.parentId,
                    dateAdded: node.dateAdded || Date.now(),
                });
            } else {
                folders.push({
                    id: node.id,
                    title: node.title,
                    parentId: node.parentId,
                    children: node.children || [],
                });
            }

            if (node.children) {
                traverse(node.children);
            }
        });
    };

    traverse(nodes);
    return { folders, links };
};

const cacheBookmarks = async (userId: string, bookmarks: BookmarkNode[]): Promise<void> => {
    const now = Date.now();
    const flattened = flattenBookmarks(bookmarks);

    await db.bookmarks
        .where("userId")
        .equals(userId)
        .filter((b) => !b.deletedAt)
        .delete();

    const cached: CachedBookmark[] = flattened.map((node) => ({
        id: generateUUID(),
        userId,
        chromeId: node.id,
        title: node.title,
        url: node.url,
        parentId: node.parentId,
        index: node.index,
        dateAdded: node.dateAdded || now,
        dateGroupModified: node.dateGroupModified,
        cachedAt: now,
        deletedAt: null,
    }));

    await db.bookmarks.bulkAdd(cached);
};

const buildTreeFromCache = (cached: CachedBookmark[]): BookmarkNode[] => {
    const nodeMap = new Map<string, BookmarkNode>();
    const rootNodes: BookmarkNode[] = [];

    cached.forEach((b) => {
        const node: BookmarkNode = {
            id: b.chromeId,
            title: b.title,
            url: b.url,
            parentId: b.parentId,
            index: b.index,
            dateAdded: b.dateAdded,
            dateGroupModified: b.dateGroupModified,
            children: [],
        };
        nodeMap.set(node.id, node);
    });

    nodeMap.forEach((node) => {
        if (!node.parentId || node.parentId === "0") {
            rootNodes.push(node);
        } else {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(node);
            } else {
                console.warn(`Orphaned bookmark node detected: "${node.title}" (id: ${node.id}) with missing parent (parentId: ${node.parentId}). This node will be excluded from the tree until the next sync.`);
            }
        }
    });

    rootNodes.sort((a, b) => (a.index || 0) - (b.index || 0));

    const sortChildren = (node: BookmarkNode) => {
        if (node.children) {
            node.children.sort((a, b) => (a.index || 0) - (b.index || 0));
            node.children.forEach(sortChildren);
        }
    };

    rootNodes.forEach(sortChildren);

    return rootNodes;
};

const loadFromCache = async (userId: string): Promise<BookmarkNode[]> => {
    const cached = await db.bookmarks
        .where("userId")
        .equals(userId)
        .filter((b) => !b.deletedAt)
        .sortBy("index");

    return buildTreeFromCache(cached);
};

const shouldRefresh = (lastSyncAt: number | null): boolean => {
    if (!lastSyncAt) return true;
    return Date.now() - lastSyncAt > CACHE_DURATION;
};

const createInitializationState = () => {
    const state = {
        isInitializing: false,
    };

    return {
        getIsInitializing: () => state.isInitializing,
        setIsInitializing: (value: boolean) => {
            state.isInitializing = value;
        },
    };
};

const initializationState = createInitializationState();

export const useBookmarksStore = create<BookmarksState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                bookmarks: [],
                folders: [],
                links: [],
                hasPermissions: false,
                isLoading: false,
                error: null,
                lastSyncAt: null,
                _hasHydrated: false,

                setHasHydrated: (state) => {
                    set({ _hasHydrated: state });
                },

                initializeStore: async () => {
                    const authState = useAuthStore.getState();
                    const user = authState.user;
                    const guestUser = authState.guestUser;
                    const userId = user?.id || guestUser?.id;

                    if (!userId) return;

                    if (initializationState.getIsInitializing()) return;
                    initializationState.setIsInitializing(true);

                    try {
                        set({ isLoading: true, error: null });

                        const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                        if (!inExtension) {
                            set({ hasPermissions: false, isLoading: false });
                            return;
                        }

                        const hasPerms = await get().checkPermissions();
                        await get().loadFromLocal();

                        if (hasPerms && shouldRefresh(get().lastSyncAt)) {
                            await get().syncFromChrome();
                        } else if (hasPerms && get().links.length === 0) {
                            await get().syncFromChrome();
                        }
                    } catch (error: any) {
                        console.error("Failed to initialize bookmarks store:", error);
                        set({ error: error?.message || "Failed to initialize store" });
                    } finally {
                        set({ isLoading: false });
                        initializationState.setIsInitializing(false);
                    }
                },

                loadFromLocal: async () => {
                    const authState = useAuthStore.getState();
                    const userId = authState.user?.id || authState.guestUser?.id;
                    if (!userId) return;

                    try {
                        const cached = await loadFromCache(userId);
                        const { folders, links } = separateFoldersAndLinks(cached);

                        set({ bookmarks: cached, folders, links });
                    } catch (error) {
                        console.error("Failed to load bookmarks from cache:", error);
                    }
                },

                syncFromChrome: async () => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) {
                        set({ hasPermissions: false });
                        return;
                    }

                    const authState = useAuthStore.getState();
                    const userId = authState.user?.id || authState.guestUser?.id;
                    if (!userId) return;

                    try {
                        const chromeTree = await chrome.bookmarks.getTree();
                        const bookmarks = chromeTree[0]?.children?.map(mapChromeBookmark) || [];

                        await cacheBookmarks(userId, bookmarks);

                        const { folders, links } = separateFoldersAndLinks(bookmarks);

                        set({
                            bookmarks,
                            folders,
                            links,
                            lastSyncAt: Date.now(),
                        });
                    } catch (error) {
                        console.error("Failed to sync bookmarks from Chrome:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to sync bookmarks" });
                    }
                },

                checkPermissions: async () => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension) {
                        set({ hasPermissions: false });
                        return false;
                    }

                    if (!chrome.bookmarks) {
                        set({ hasPermissions: false });
                        return false;
                    }

                    try {
                        if (chrome.permissions) {
                            const granted = await chrome.permissions.contains({
                                permissions: ["bookmarks"],
                            });

                            if (granted) {
                                set({ hasPermissions: true });
                                return true;
                            }
                        }

                        const hasBookmarksApi = typeof chrome.bookmarks !== "undefined";
                        if (hasBookmarksApi) {
                            console.log("Bookmarks API available, checking if we can access it");
                            try {
                                await chrome.bookmarks.getTree();
                                set({ hasPermissions: true });
                                return true;
                            } catch (error) {
                                console.log("Cannot access bookmarks API:", error);
                                set({ hasPermissions: false });
                                return false;
                            }
                        }

                        set({ hasPermissions: false });
                        return false;
                    } catch (error) {
                        console.error("Error checking permissions:", error);
                        set({ hasPermissions: false });
                        return false;
                    }
                },

                requestPermissions: async () => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    console.log("requestPermissions called, isExtension:", isExtension, "inExtension:", inExtension);

                    if (!inExtension) {
                        console.warn("Not in extension environment");
                        set({ hasPermissions: false });
                        return false;
                    }

                    if (!chrome) {
                        console.error("chrome object not available");
                        set({ hasPermissions: false });
                        return false;
                    }

                    console.log("chrome.bookmarks available:", typeof chrome.bookmarks !== "undefined");
                    console.log("chrome.permissions available:", typeof chrome.permissions !== "undefined");

                    if (!chrome.permissions) {
                        console.warn("chrome.permissions API not available");
                        if (chrome.bookmarks) {
                            console.log("But chrome.bookmarks is available, trying direct access");
                            try {
                                await chrome.bookmarks.getTree();
                                console.log("Direct access successful!");
                                set({ hasPermissions: true });
                                await get().syncFromChrome();
                                return true;
                            } catch (error) {
                                console.error("Direct access failed:", error);
                                set({ hasPermissions: false });
                                return false;
                            }
                        }
                        set({ hasPermissions: false });
                        return false;
                    }

                    try {
                        console.log("Requesting bookmarks permission via chrome.permissions...");
                        const granted = await chrome.permissions.request({
                            permissions: ["bookmarks"],
                        });

                        console.log("Bookmarks permission request result:", granted);

                        set({ hasPermissions: granted });
                        if (granted) {
                            console.log("Permission granted, syncing bookmarks...");
                            await get().syncFromChrome();
                        } else {
                            console.warn("Permission denied by user");
                        }

                        return granted;
                    } catch (error) {
                        console.error("Failed to request bookmarks permission:", error);

                        if (chrome.bookmarks) {
                            console.log("Trying direct access as fallback...");
                            try {
                                await chrome.bookmarks.getTree();
                                console.log("Direct access successful after permission error!");
                                set({ hasPermissions: true });
                                await get().syncFromChrome();
                                return true;
                            } catch (directError) {
                                console.error("Direct access also failed:", directError);
                            }
                        }

                        set({ hasPermissions: false });
                        return false;
                    }
                },

                refreshBookmarks: async () => {
                    if (!get().hasPermissions) {
                        const granted = await get().requestPermissions();
                        if (!granted) return;
                    }

                    await get().syncFromChrome();
                },

                addBookmark: async (bookmark) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        await chrome.bookmarks.create({
                            title: bookmark.title,
                            url: bookmark.url,
                            parentId: bookmark.parentId,
                        });

                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to add bookmark:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to add bookmark" });
                    }
                },

                updateBookmark: async (id, updates) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        const changes: any = {};
                        if (updates.title !== undefined) changes.title = updates.title;
                        if (updates.url !== undefined) changes.url = updates.url;

                        await chrome.bookmarks.update(id, changes);

                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to update bookmark:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to update bookmark" });
                    }
                },

                deleteBookmark: async (id) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        await chrome.bookmarks.remove(id);
                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to delete bookmark:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to delete bookmark" });
                    }
                },

                addFolder: async (folder) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        await chrome.bookmarks.create({
                            title: folder.title,
                            parentId: folder.parentId,
                        });

                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to add folder:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to add folder" });
                    }
                },

                updateFolder: async (id, updates) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        const changes: any = {};
                        if (updates.title !== undefined) changes.title = updates.title;

                        await chrome.bookmarks.update(id, changes);

                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to update folder:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to update folder" });
                    }
                },

                deleteFolder: async (id) => {
                    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
                    if (!inExtension || !chrome.bookmarks) return;

                    try {
                        await chrome.bookmarks.removeTree(id);
                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to delete folder:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to delete folder" });
                    }
                },
            }),
            {
                name: "meelio:local:bookmarks:settings",
                storage: createJSONStorage(() => {
                    if (chrome?.storage?.local) {
                        return {
                            getItem: async (name) => {
                                const result = await chrome.storage.local.get(name);
                                return result[name];
                            },
                            setItem: async (name, value) => {
                                await chrome.storage.local.set({ [name]: value });
                            },
                            removeItem: async (name) => {
                                await chrome.storage.local.remove(name);
                            },
                        };
                    }
                    return localStorage;
                }),
                partialize: (s) => ({
                    hasPermissions: s.hasPermissions,
                    lastSyncAt: s.lastSyncAt,
                }),
                onRehydrateStorage: () => (state) => {
                    state?.setHasHydrated(true);
                    if (state && state.hasPermissions) {
                        state.initializeStore();
                    }
                },
            }
        )
    )
);

const checkAndSetupListeners = () => {
    const inExtension = typeof chrome !== "undefined" && !!chrome.storage;
    if (inExtension && chrome.bookmarks) {
        chrome.bookmarks.onCreated.addListener(() => {
            const store = useBookmarksStore.getState();
            if (store.hasPermissions) {
                store.syncFromChrome();
            }
        });

        chrome.bookmarks.onChanged.addListener(() => {
            const store = useBookmarksStore.getState();
            if (store.hasPermissions) {
                store.syncFromChrome();
            }
        });

        chrome.bookmarks.onRemoved.addListener(() => {
            const store = useBookmarksStore.getState();
            if (store.hasPermissions) {
                store.syncFromChrome();
            }
        });

        chrome.bookmarks.onMoved.addListener(() => {
            const store = useBookmarksStore.getState();
            if (store.hasPermissions) {
                store.syncFromChrome();
            }
        });
    }
};

checkAndSetupListeners();

