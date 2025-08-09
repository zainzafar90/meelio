import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { AxiosInstance } from "axios";
import { axios } from "../api/axios";
import {
  createNote,
  updateNote,
  deleteNote,
  getNotes,
  CreateNoteDto,
  UpdateNoteDto,
} from "../api/note.api";
import { Note } from "../lib/db/models.dexie";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { useSyncStore, SyncOperation } from "./sync.store";
import { generateUUID } from "../utils/common.utils";

/** Data required to create or update a note. */
export interface NoteInput {
  title: string;
  content: string;
}

/** Shape of the note store state. */
export interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  addNote: (note: NoteInput) => Promise<void>;
  updateNote: (id: string, updates: Partial<NoteInput>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  loadFromLocal: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

class NotProError extends Error {
  constructor() {
    super("Notes require a Pro subscription");
  }
}

const NOTE_ENTITY = "note";

const assertProUser = (): string => {
  const user = useAuthStore.getState().user;
  if (!user?.isPro) throw new NotProError();
  return user.id;
};

const handleOperation = async (
  client: AxiosInstance,
  op: SyncOperation,
): Promise<void> => {
  switch (op.type) {
    case "create": {
      const created = await createNote(client, op.data as CreateNoteDto);
      await db.notes.update(op.entityId, {
        id: created.id,
        updatedAt: Date.now(),
      });
      useNoteStore.setState((state) => ({
        notes: state.notes.map((n) =>
          n.id === op.entityId ? { ...n, id: created.id } : n,
        ),
      }));
      break;
    }
    case "update": {
      await updateNote(client, op.entityId, op.data as UpdateNoteDto);
      break;
    }
    case "delete": {
      await deleteNote(client, op.entityId);
      break;
    }
  }
};

const processQueue = async (client: AxiosInstance): Promise<void> => {
  const sync = useSyncStore.getState();
  const queue = sync.getQueue(NOTE_ENTITY);
  if (!sync.isOnline) return;
  sync.setSyncing(NOTE_ENTITY, true);
  for (const op of queue) {
    try {
      await handleOperation(client, op);
      sync.removeFromQueue(NOTE_ENTITY, op.id);
    } catch {
      const exceeded = op.retries >= 3;
      if (exceeded) sync.removeFromQueue(NOTE_ENTITY, op.id);
      else sync.incrementRetry(NOTE_ENTITY, op.id);
    }
  }
  sync.setSyncing(NOTE_ENTITY, false);
  sync.setLastSyncTime(NOTE_ENTITY, Date.now());
};

/** Store for managing notes with offline sync. */
export const useNoteStore = create<NoteState>()(
  subscribeWithSelector((set) => ({
    notes: [],
    isLoading: false,
    error: null,

    addNote: async (input) => {
      const userId = assertProUser();
      const note: Note = {
        id: generateUUID(),
        userId,
        title: input.title,
        content: input.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.notes.add(note);
      set((state) => ({ notes: [...state.notes, note] }));
      useSyncStore.getState().addToQueue(NOTE_ENTITY, {
        type: "create",
        entityId: note.id,
        data: { title: note.title, content: note.content },
      });
    },

    updateNote: async (id, updates) => {
      assertProUser();
      await db.notes.update(id, { ...updates, updatedAt: Date.now() });
      set((state) => ({
        notes: state.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
        ),
      }));
      useSyncStore.getState().addToQueue(NOTE_ENTITY, {
        type: "update",
        entityId: id,
        data: updates,
      });
    },

    deleteNote: async (id) => {
      assertProUser();
      await db.notes.delete(id);
      set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      useSyncStore.getState().addToQueue(NOTE_ENTITY, {
        type: "delete",
        entityId: id,
      });
    },

    loadFromLocal: async () => {
      const userId = assertProUser();
      const notes = await db.notes.where("userId").equals(userId).toArray();
      set({ notes });
    },

    syncWithServer: async () => {
      await processQueue(axios);
      const notes = await getNotes(axios);
      await db.notes.clear();
      await db.notes.bulkAdd(notes);
      set({ notes });
    },
  })),
);
