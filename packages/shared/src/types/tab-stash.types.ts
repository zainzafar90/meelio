export type TabGroupColor =
  | "grey"
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "pink"
  | "purple"
  | "cyan"
  | "orange";

export interface TabGroup {
  id: number;
  title?: string;
  color: TabGroupColor;
  collapsed: boolean;
}

export interface TabSession {
  id: string;
  name: string;
  timestamp: number;
  tabs: TabInfo[];
  windowCount: number;
  groups?: Record<number, TabGroup>;
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

export interface TabStashState {
  sessions: TabSession[];
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  addSession: (session: TabSession) => Promise<any>;
  removeSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => void;
  restoreSession: (sessionId: string) => Promise<void>;

  clearAllSessions: () => void;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  setHasHydrated: (state: boolean) => void;
}
