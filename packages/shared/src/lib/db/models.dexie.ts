// Simplified models without sync metadata

export interface SiteBlocker {
  id: string;
  userId: string;
  url: string;
  isBlocked: boolean;
  blockPattern: string;
  scheduleEnabled: boolean;
  scheduleStart?: string;
  scheduleEnd?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BackgroundMetadata {
  name: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
}

export interface Backgrounds {
  id: string;
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
  createdAt: number;
  updatedAt: number;
}

// Simplified Task model - unified with backend
export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  category?: string;
  dueDate?: string;
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