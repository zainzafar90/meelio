import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { Note } from "../lib/db/models.notes";
import { useAuthStore } from "./auth.store";
import { SyncState, useSyncStore } from "./sync.store";
import { EntitySyncManager, createEntitySync } from "../utils/sync-core";
import { createAdapter, normalizeDates } from "../utils/sync-adapters";
import { noteApi } from "../api/note.api";
import { generateUUID } from "../utils/common.utils";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  enableTypingSound: boolean;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  addNote: (payload: { title: string; content?: string | null; pinned?: boolean; categoryId?: string | null; providerId?: string | null }) => Promise<Note | undefined>;
  updateNote: (id: string, payload: Partial<Pick<Note, "title" | "content" | "pinned" | "categoryId">>) => Promise<void>;
  togglePinNote: (noteId: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  setEnableTypingSound: (enabled: boolean) => void;
}

let noteSyncManager: EntitySyncManager<Note, any, any, any, any> | null = null;
let isInitializing = false;

export const useNoteStore = create<NoteState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        notes: [],
        isLoading: false,
        error: null,
        enableTypingSound: true,

        initializeStore: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          if (isInitializing) {
            return;
          }

          isInitializing = true;

          try {
            set({ isLoading: true, error: null });

            // Ensure sync manager is ready for current Pro users even if auth store hasn't emitted
            if (user?.isPro && !noteSyncManager) {
              initializeNoteSync();
            }

            await get().loadFromLocal();

            if (user?.isPro) {
              const syncStore = useSyncStore.getState();
              if (syncStore.isOnline) {
                await get().syncWithServer();
              }
            }
          } catch (error: any) {
            console.error("Failed to initialize note store:", error);
            set({ error: error?.message || "Failed to initialize store" });
          } finally {
            set({ isLoading: false });
            isInitializing = false;
          }
        },

        loadFromLocal: async () => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;

          if (!userId) return;

          const localNotes = await db.notes
            .where("userId")
            .equals(userId)
            .toArray();

          set({
            notes: localNotes.filter(n => !n.deletedAt),
          });
        },

        syncWithServer: async () => {
          if (!noteSyncManager) return;
          await noteSyncManager.syncWithServer();
        },

        addNote: async ({ title, content, pinned, categoryId, providerId }) => {
          const MAX_NOTES = 500;
          const MAX_NOTE_CHARS = 10000;
          const truncateToChars = (text: string, maxChars: number) =>
            typeof text === "string" ? text.slice(0, maxChars) : text as any;

          if (get().notes.length >= MAX_NOTES) {
            return undefined;
          }

          const authState = useAuthStore.getState();
          const user = authState.user;
          const guestUser = authState.guestUser;
          const userId = user?.id || guestUser?.id;
          if (!userId) return;

          const syncStore = useSyncStore.getState();
          const now = Date.now();
          const id = generateUUID();

          const note: Note = {
            id,
            userId,
            title,
            content: typeof content === "string" ? truncateToChars(content, MAX_NOTE_CHARS) : null,
            pinned: pinned ?? false,
            categoryId: categoryId ?? null,
            providerId: providerId ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };

          // If creating a pinned note, unpin all others first
          if (note.pinned) {
            const pinnedNotes = get().notes.filter((n) => n.pinned);
            await Promise.all(
              pinnedNotes.map(async (n) => {
                await db.notes.update(n.id, {
                  pinned: false,
                  updatedAt: Date.now(),
                });
                if (user?.isPro) {
                  syncStore.addToQueue("note", {
                    type: "update",
                    entityId: n.id,
                    data: { pinned: false, updatedAt: Date.now() },
                  });
                }
              })
            );

            set((state) => ({
              notes: state.notes.map((n) =>
                n.pinned ? { ...n, pinned: false, updatedAt: Date.now() } : n
              ),
            }));
          }

          try {
            await db.notes.add(note);
            set((s) => ({ notes: [note, ...s.notes] }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("note", {
                type: "create",
                entityId: id,
                data: note,
              });

              if (syncStore.isOnline && noteSyncManager) {
                noteSyncManager.processQueue();
              }
            }

            return note;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to add note",
            });
            return undefined;
          }
        },

        updateNote: async (id, payload) => {
          const MAX_NOTE_CHARS = 10000;
          const truncateToChars = (text: string, maxChars: number) =>
            typeof text === "string" ? text.slice(0, maxChars) : text as any;

          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();

          const now = Date.now();
          const toSave = { ...payload } as any;
          if (typeof toSave.content === "string") {
            toSave.content = truncateToChars(toSave.content, MAX_NOTE_CHARS);
          }

          const updatedData = { ...toSave, updatedAt: now };

          try {
            await db.notes.update(id, updatedData);
            set((s) => ({
              notes: s.notes.map((n) => (n.id === id ? { ...n, ...updatedData } : n)),
            }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("note", {
                type: "update",
                entityId: id,
                data: updatedData,
              });

              if (syncStore.isOnline && noteSyncManager) {
                noteSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to update note",
            });
          }
        },

        togglePinNote: async (noteId) => {
          const note = get().notes.find((n) => n.id === noteId);
          if (!note) return;

          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();
          const updatedData = { pinned: !note.pinned, updatedAt: Date.now() };

          const unpinOthers = async () => {
            const pinnedNotes = get().notes.filter(
              (n) => n.pinned && n.id !== noteId
            );
            await Promise.all(
              pinnedNotes.map(async (n) => {
                await db.notes.update(n.id, {
                  pinned: false,
                  updatedAt: Date.now(),
                });
                if (user?.isPro) {
                  syncStore.addToQueue("note", {
                    type: "update",
                    entityId: n.id,
                    data: { pinned: false, updatedAt: Date.now() },
                  });
                }
              })
            );

            set((state) => ({
              notes: state.notes.map((n) =>
                n.pinned && n.id !== noteId
                  ? { ...n, pinned: false, updatedAt: Date.now() }
                  : n
              ),
            }));
          };

          try {
            if (updatedData.pinned) {
              await unpinOthers();
            }

            await db.notes.update(noteId, updatedData);

            set((state) => ({
              notes: state.notes.map((n) =>
                n.id === noteId ? { ...n, ...updatedData } : n
              ),
            }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("note", {
                type: "update",
                entityId: noteId,
                data: updatedData,
              });

              if (syncStore.isOnline && noteSyncManager) {
                noteSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to pin note",
            });
          }
        },

        deleteNote: async (id) => {
          const authState = useAuthStore.getState();
          const user = authState.user;
          const syncStore = useSyncStore.getState();

          try {
            const deletedAt = Date.now();
            // Soft delete locally (tombstone)
            await db.notes.update(id, { deletedAt, updatedAt: deletedAt });

            set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));

            // Only sync for Pro users
            if (user?.isPro) {
              syncStore.addToQueue("note", {
                type: "delete",
                entityId: id,
                data: { deletedAt },
              });

              if (syncStore.isOnline && noteSyncManager) {
                noteSyncManager.processQueue();
              }
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to delete note",
            });
          }
        },

        setEnableTypingSound: (enabled: boolean) => set({ enableTypingSound: enabled }),
      }),
      {
        name: "meelio:local:notes:settings",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ enableTypingSound: s.enableTypingSound }),
      }
    )
  )
);

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                    Note Sync Manager Initialization                   ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║  Sets up the note sync manager with proper adapters and               ║
 * ║  configuration for offline-first synchronization.                     ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
function initializeNoteSync() {
  const noteAdapter = createAdapter<Note, any>({
    entityKey: "note",
    dbTable: db.notes as any,
    api: {
      bulkSync: noteApi.bulkSync,
      fetchAll: () => noteApi.getNotes(),
    },
    store: {
      getUserId: () => useAuthStore.getState().user?.id,
      getItems: () => useNoteStore.getState().notes,
      setItems: (list) => useNoteStore.setState({ notes: list }),
    },
    normalizeFromServer: (n: any): Note => normalizeDates(n),
    customTransformers: {
      toCreatePayload: (op) => {
        if (op.type !== "create") return null;
        const d = op.data || {};
        return {
          clientId: op.entityId,
          title: d.title,
          content: d.content,
          pinned: d.pinned,
          categoryId: d.categoryId,
          providerId: d.providerId,
          updatedAt: d.updatedAt,
        };
      },
      toUpdatePayload: (op) => {
        if (op.type !== "update") return null;
        const d = op.data || {};
        return {
          id: op.entityId,
          clientId: op.entityId,
          title: d.title,
          content: d.content,
          pinned: d.pinned,
          categoryId: d.categoryId,
          providerId: d.providerId,
          updatedAt: d.updatedAt,
          deletedAt: d.deletedAt,
        };
      },
    },
    options: {
      autoSync: true,
      syncInterval: 60 * 60 * 1000, // 1 hour
      enableOptimisticUpdates: true,
    },
  });

  noteSyncManager = createEntitySync(noteAdapter);
}

// Initialize on first Pro user login
useAuthStore.subscribe((state) => {
  const user = state.user;
  if (user?.isPro && !noteSyncManager) {
    initializeNoteSync();
  } else if ((!user || !user.isPro) && noteSyncManager) {
    noteSyncManager.dispose();
    noteSyncManager = null;
  }
});

/**
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║                    Handle Online Status Changes                       ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║  Triggers sync queue processing when transitioning from offline       ║
 * ║  to online. Ensures no concurrent syncs are running.                  ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 */
let isSyncingOnReconnect = false;

const handleOnlineStatusChange = (state: SyncState, prevState: SyncState) => {
  const justCameOnline = state.isOnline && !prevState.isOnline;
  const isProUser = useAuthStore.getState().user?.isPro;
  const canSync = justCameOnline && isProUser && !isSyncingOnReconnect;

  if (canSync) {
    isSyncingOnReconnect = true;
    useNoteStore
      .getState()
      .syncWithServer()
      .finally(() => {
        isSyncingOnReconnect = false;
      });
  }
};

useSyncStore.subscribe(handleOnlineStatusChange);

// Initialize immediately if already logged-in Pro user when this module loads
(() => {
  const user = useAuthStore.getState().user;
  if (user?.isPro && !noteSyncManager) {
    initializeNoteSync();
  }
})();