import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { Note } from "../lib/db/models.notes";
import { useAuthStore } from "./auth.store";
import { useSyncStore } from "./sync.store";
import { lwwMergeById } from "../utils/sync.utils";
import { noteApi } from "../api/note.api";
import { generateUUID } from "../utils/common.utils";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;

  initializeStore: () => Promise<void>;

  addNote: (payload: { title: string; content?: string | null; categoryId?: string | null; providerId?: string | null }) => Promise<Note | undefined>;
  updateNote: (id: string, payload: Partial<Pick<Note, "title" | "content" | "categoryId">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  syncWithServer: () => Promise<void>;
}

let isProcessingSyncQueue = false;

async function processSyncQueue() {
  if (isProcessingSyncQueue) return;
  const syncStore = useSyncStore.getState();
  const queue = syncStore.getQueue("note");
  if (!queue.length || !syncStore.isOnline) return;

  isProcessingSyncQueue = true;
  syncStore.setSyncing("note", true);

  const creates: any[] = [];
  const updates: any[] = [];
  const deletes: any[] = [];
  for (const op of queue) {
    if (op.type === "create") {
      creates.push({ clientId: op.entityId, ...op.data });
    } else if (op.type === "update") {
      updates.push({ id: op.entityId, ...op.data });
    } else if (op.type === "delete") {
      deletes.push({ id: op.entityId, deletedAt: op.data?.deletedAt });
    }
  }

  try {
    const result = await noteApi.bulkSync({ creates, updates, deletes });
    const idMap = new Map<string, string>();
    for (const c of result.created) {
      if (c.clientId && c.id !== c.clientId) idMap.set(c.clientId, c.id);
    }

    await db.transaction("rw", db.notes, async () => {
      for (const created of result.created) {
        if (created.clientId && created.id !== created.clientId) {
          await db.notes.delete(created.clientId);
          const normalized: Note = {
            ...created,
            createdAt: new Date(created.createdAt as any).getTime(),
            updatedAt: new Date(created.updatedAt as any).getTime(),
            deletedAt: (created as any).deletedAt ? new Date((created as any).deletedAt).getTime() : null,
          } as any;
          await db.notes.add(normalized);
        }
      }

      for (const u of result.updated) {
        const normalized: Partial<Note> = {
          ...u as any,
          createdAt: new Date((u as any).createdAt).getTime(),
          updatedAt: new Date((u as any).updatedAt).getTime(),
          deletedAt: (u as any).deletedAt ? new Date((u as any).deletedAt).getTime() : null,
        };
        await db.notes.update((u as any).id, normalized as any);
      }
    });

    // clear queue
    for (const op of queue) syncStore.removeFromQueue("note", op.id);
  } catch (err) {
    console.error("Note bulk sync failed:", err);
  } finally {
    isProcessingSyncQueue = false;
    syncStore.setSyncing("note", false);
  }
}

export const useNoteStore = create<NoteState>()(
  subscribeWithSelector((set, get) => ({
    notes: [],
    isLoading: false,
    error: null,

    initializeStore: async () => {
      set({ isLoading: true, error: null });
      try {
        const auth = useAuthStore.getState();
        const userId = auth.user?.id || auth.guestUser?.id;
        if (!userId) return set({ isLoading: false });

        const localNotes = await db.notes.where("userId").equals(userId).toArray();
        set({ notes: localNotes.filter((n) => !n.deletedAt) });

        if (auth.user?.isPro) {
          await get().syncWithServer();
        }
      } catch (e: any) {
        set({ error: e?.message || "Failed to load notes" });
      } finally {
        set({ isLoading: false });
      }
    },

    addNote: async ({ title, content, categoryId, providerId }) => {
      const MAX_NOTES = 500;
      const MAX_NOTE_CHARS = 10000;
      const truncateToChars = (text: string, maxChars: number) =>
        typeof text === "string" ? text.slice(0, maxChars) : text as any;

      if (get().notes.length >= MAX_NOTES) {
        return undefined;
      }
      const auth = useAuthStore.getState();
      const user = auth.user;
      const guestUser = auth.guestUser;
      const userId = user?.id || guestUser?.id;
      if (!userId) return;

      const now = Date.now();
      const id = generateUUID();
      const note: Note = {
        id,
        userId,
        title,
        content: typeof content === "string" ? truncateToChars(content, MAX_NOTE_CHARS) : null,
        categoryId: categoryId ?? null,
        providerId: providerId ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      await db.notes.add(note);
      set((s) => ({ notes: [note, ...s.notes] }));

      const syncStore = useSyncStore.getState();
      syncStore.addToQueue("note", {
        type: "create",
        entityId: id,
        data: { title, content: note.content, categoryId, providerId, updatedAt: now },
      } as any);

      processSyncQueue();

      return note;
    },

    updateNote: async (id, payload) => {
      const MAX_NOTE_CHARS = 10000;
      const truncateToChars = (text: string, maxChars: number) =>
        typeof text === "string" ? text.slice(0, maxChars) : text as any;
      const now = Date.now();
      const toSave = { ...payload } as any;
      if (typeof toSave.content === "string") {
        toSave.content = truncateToChars(toSave.content, MAX_NOTE_CHARS);
      }
      await db.notes.update(id, { ...toSave, updatedAt: now } as any);
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? ({ ...n, ...toSave, updatedAt: now } as any) : n)),
      }));

      const syncStore = useSyncStore.getState();
      syncStore.addToQueue("note", { type: "update", entityId: id, data: { ...toSave, updatedAt: now } } as any);
      processSyncQueue();
    },

    deleteNote: async (id) => {
      const now = Date.now();
      await db.notes.update(id, { deletedAt: now, updatedAt: now } as any);
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));

      const syncStore = useSyncStore.getState();
      syncStore.addToQueue("note", { type: "delete", entityId: id, data: { deletedAt: now } } as any);
      processSyncQueue();
    },

    syncWithServer: async () => {
      const auth = useAuthStore.getState();
      const user = auth.user;
      if (!user?.isPro) return;

      const syncStore = useSyncStore.getState();
      try {
        await processSyncQueue();
        const server = await noteApi.getNotes();
        const normalized = server.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt).getTime(),
          updatedAt: new Date(n.updatedAt).getTime(),
          deletedAt: n.deletedAt ? new Date(n.deletedAt).getTime() : null,
        }));
        const local = await db.notes.where("userId").equals(user.id).toArray();
        const merged = lwwMergeById<Note>(local as any, normalized as any);
        await db.transaction("rw", db.notes, async () => {
          await db.notes.where("userId").equals(user.id).delete();
          await db.notes.bulkAdd(merged);
        });
        set({ notes: merged.filter((n) => !n.deletedAt) });
        syncStore.setSyncing("note", false);
        syncStore.setLastSyncTime("note", Date.now());
      } catch (e) {
        console.error("Sync failed:", e);
        syncStore.setSyncing("note", false);
      }
    },
  }))
);

