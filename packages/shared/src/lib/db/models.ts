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

export interface Background extends BaseModel {
  userId: string;
  type: "static" | "live";
  url: string;
  metadata: BackgroundMetadata;
  schedule?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
  };
  isSelected?: boolean;
  isDefault?: boolean;
}

export interface QueryCache {
  id: string;
  client: any;
  timestamp: number;
}
