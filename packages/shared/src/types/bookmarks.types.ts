export interface BookmarkNode {
    id: string;
    title: string;
    url?: string;
    parentId?: string;
    index?: number;
    dateAdded?: number;
    dateGroupModified?: number;
    children?: BookmarkNode[];
}

export interface CachedBookmark {
    id: string;
    userId: string;
    chromeId: string;
    title: string;
    url?: string;
    parentId?: string;
    index?: number;
    favicon?: string;
    dateAdded: number;
    dateGroupModified?: number;
    cachedAt: number;
    deletedAt?: number | null;
}

export interface BookmarkFolder {
    id: string;
    title: string;
    parentId?: string;
    children: BookmarkNode[];
}

export interface BookmarkLink {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    parentId?: string;
    dateAdded: number;
}

