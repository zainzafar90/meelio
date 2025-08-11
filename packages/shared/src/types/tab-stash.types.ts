export interface TabSession {
  id: string;
  name: string;
  timestamp: number;
  tabs: TabInfo[];
  windowCount: number;
}

export interface TabInfo {
  title: string;
  url: string;
  favicon?: string;
  windowId: number;
  pinned: boolean;
  id?: number;
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
  removeTabFromSession?: (sessionId: string, tabId: number) => void;
  updateSession?: (session: TabSession) => void;
  
  clearAllSessions: () => void;
  loadSessions?: () => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  setHasHydrated: (state: boolean) => void;
}
