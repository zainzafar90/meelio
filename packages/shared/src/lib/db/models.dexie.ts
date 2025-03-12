export interface BaseModel {
  id: string;
  _syncStatus: "pending" | "synced" | "error";
  _lastModified: number;
  _version: number;
  _errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SiteBlocker extends BaseModel {
  url: string;
  isBlocked: boolean;
  blockPattern: string;
  scheduleEnabled: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  userId: string;
}

export interface BackgroundMetadata {
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
}

export interface Backgrounds extends BaseModel {
  userId: string;
  type: "static" | "live";
  url: string;
  metadata: BackgroundMetadata;
  schedule?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
  isFavourite?: boolean;
}

// Todo interfaces
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string;
  listId: string;
  createdAt: number;
  updatedAt: number;
  assignees?: {
    name: string;
    image?: string;
  }[];
}

export interface TodoList {
  id: string;
  name: string;
  icon?: string;
  emoji: string;
  type: "system" | "custom";
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
