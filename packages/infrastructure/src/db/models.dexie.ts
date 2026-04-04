import type { TimerStage } from "@repo/contracts/timer";

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

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon?: string;
  type: "system" | "user";
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface PomodoroSession {
  id?: number;
  userId?: string;
  timestamp: number;
  stage: TimerStage;
  duration: number;
  completed: boolean;
}

export interface DailySummary {
  id?: number;
  date: string;
  focusSessions: number;
  breaks: number;
  totalFocusTime: number;
  totalBreakTime: number;
}

export interface CachedSound {
  id: string;
  path: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  downloadedAt: number;
}

export interface TabGroup {
  id: number;
  title?: string;
  color: "grey" | "blue" | "red" | "yellow" | "green" | "pink" | "purple" | "cyan" | "orange";
  collapsed: boolean;
}

export interface TabInfo {
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  pinned: boolean;
  id?: number;
  groupId?: number;
  groupData?: TabGroup;
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

export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  categoryId?: string | null;
  providerId?: string | null;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}
