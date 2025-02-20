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
  addSession: (session: TabSession) => void;
  removeSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newName: string) => void;
  restoreSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => void;
  loadSessions: () => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
}
