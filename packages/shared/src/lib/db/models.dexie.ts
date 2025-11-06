import { TabGroup, TabInfo } from "../../types/tab-stash.types";

export interface SiteBlocker {
  id: string;
  userId: string;
  url: string;
  category?: string;
  isBlocked: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface BackgroundMetadata {
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
}

// Simplified Task model - unified with backend
export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  pinned: boolean;
  dueDate?: string;
  categoryId?: string;
  providerId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// Add Category model
export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon?: string;
  type: "system" | "user";
  createdAt: number;
  updatedAt: number;
}

export interface PomodoroSession {
  id?: number;
  timestamp: number;
  stage: number;
  duration: number;
  completed: boolean;
}

export interface DailySummary {
  id?: number;
  date: string; // YYYY-MM-DD format
  focusSessions: number;
  breaks: number;
  totalFocusTime: number; // in seconds
  totalBreakTime: number; // in seconds
}

export interface CachedSound {
  id: string;
  path: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  downloadedAt: number;
}

export interface TabStash {
  id: string;
  userId: string;
  windowId: string;
  urls: string[];
  tabsData?: TabInfo[] | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
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

export interface CachedWeather {
  id: string;
  locationKey: string;
  locationName: string;
  currentWeather: string;
  forecast: string;
  cachedAt: number;
}