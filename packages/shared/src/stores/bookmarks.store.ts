import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { CachedBookmark } from "../lib/db/models.dexie";
import { useAuthStore } from "./auth.store";
import type { BookmarkNode, BookmarkLink, BookmarkFolder } from "../types/bookmarks.types";
import { generateUUID } from "../utils/common.utils";

export type BookmarksDisplayMode = 'hidden' | 'bar' | 'sheet' | 'both';

interface BookmarksState {
    bookmarks: BookmarkNode[];
    folders: BookmarkFolder[];
    links: BookmarkLink[];
    hasPermissions: boolean;
    isLoading: boolean;
    error: string | null;
    lastSyncAt: number | null;
    displayMode: BookmarksDisplayMode;

    setDisplayMode: (mode: BookmarksDisplayMode) => void;
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
}

const CACHE_DURATION = 60 * 60 * 1000;

function isExtensionEnvironment(): boolean {
    return typeof chrome !== "undefined" && !!chrome.storage;
}

function hasBookmarksApi(): boolean {
    return isExtensionEnvironment() && !!chrome.bookmarks;
}

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
                displayMode: 'bar' as BookmarksDisplayMode,

                setDisplayMode: (mode: BookmarksDisplayMode) => {
                    set({ displayMode: mode });
                },

                initializeStore: async () => {
                    const userId = useAuthStore.getState().user?.id;
                    if (!userId) return;

                    if (initializationState.getIsInitializing()) return;
                    initializationState.setIsInitializing(true);

                    try {
                        set({ isLoading: true, error: null });

                        if (!isExtensionEnvironment()) {
                            set({ hasPermissions: false, isLoading: false });
                            return;
                        }

                        const hasPerms = await get().checkPermissions();
                        await get().loadFromLocal();

                        const needsSync = hasPerms && (shouldRefresh(get().lastSyncAt) || get().links.length === 0);
                        if (needsSync) {
                            await get().syncFromChrome();
                        }
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : "Failed to initialize store";
                        console.error("Failed to initialize bookmarks store:", error);
                        set({ error: message });
                    } finally {
                        set({ isLoading: false });
                        initializationState.setIsInitializing(false);
                    }
                },

                loadFromLocal: async () => {
                    const userId = useAuthStore.getState().user?.id;
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
                    if (!hasBookmarksApi()) {
                        set({ hasPermissions: false });
                        return;
                    }

                    const userId = useAuthStore.getState().user?.id;
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
                    if (!isExtensionEnvironment() || !chrome.bookmarks) {
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

                        // Fallback: try to access bookmarks API directly
                        await chrome.bookmarks.getTree();
                        set({ hasPermissions: true });
                        return true;
                    } catch {
                        set({ hasPermissions: false });
                        return false;
                    }
                },

                requestPermissions: async () => {
                    if (!isExtensionEnvironment()) {
                        set({ hasPermissions: false });
                        return false;
                    }

                    // Helper to attempt direct API access as fallback
                    const tryDirectAccess = async (): Promise<boolean> => {
                        if (!chrome.bookmarks) return false;
                        try {
                            await chrome.bookmarks.getTree();
                            set({ hasPermissions: true });
                            await get().syncFromChrome();
                            return true;
                        } catch {
                            return false;
                        }
                    };

                    if (!chrome.permissions) {
                        const success = await tryDirectAccess();
                        if (!success) set({ hasPermissions: false });
                        return success;
                    }

                    try {
                        const granted = await chrome.permissions.request({
                            permissions: ["bookmarks"],
                        });

                        set({ hasPermissions: granted });
                        if (granted) {
                            await get().syncFromChrome();
                        }

                        return granted;
                    } catch (error) {
                        console.error("Failed to request bookmarks permission:", error);

                        const success = await tryDirectAccess();
                        if (!success) set({ hasPermissions: false });
                        return success;
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
                    if (!hasBookmarksApi()) return;

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
                    if (!hasBookmarksApi()) return;

                    try {
                        const changes: chrome.bookmarks.BookmarkChangesArg = {};
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
                    if (!hasBookmarksApi()) return;

                    try {
                        await chrome.bookmarks.remove(id);
                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to delete bookmark:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to delete bookmark" });
                    }
                },

                addFolder: async (folder) => {
                    if (!hasBookmarksApi()) return;

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
                    if (!hasBookmarksApi()) return;

                    try {
                        const changes: chrome.bookmarks.BookmarkChangesArg = {};
                        if (updates.title !== undefined) changes.title = updates.title;

                        await chrome.bookmarks.update(id, changes);
                        await get().syncFromChrome();
                    } catch (error) {
                        console.error("Failed to update folder:", error);
                        set({ error: error instanceof Error ? error.message : "Failed to update folder" });
                    }
                },

                deleteFolder: async (id) => {
                    if (!hasBookmarksApi()) return;

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
                name: "meelio:local:bookmarks",
                version: 1,
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
                    displayMode: s.displayMode,
                }),
                onRehydrateStorage: () => (state) => {
                    if (state && state.hasPermissions) {
                        state.initializeStore();
                    }
                },
            }
        )
    )
);

function setupBookmarkListeners(): void {
    if (!hasBookmarksApi()) return;

    const syncIfAuthorized = (): void => {
        const store = useBookmarksStore.getState();
        if (store.hasPermissions) {
            store.syncFromChrome();
        }
    };

    chrome.bookmarks.onCreated.addListener(syncIfAuthorized);
    chrome.bookmarks.onChanged.addListener(syncIfAuthorized);
    chrome.bookmarks.onRemoved.addListener(syncIfAuthorized);
    chrome.bookmarks.onMoved.addListener(syncIfAuthorized);
}

setupBookmarkListeners();

