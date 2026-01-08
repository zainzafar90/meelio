import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../lib/db/meelio.dexie";
import type { Note } from "../lib/db/models.notes";
import { useAuthStore } from "./auth.store";
import { generateUUID } from "../utils/common.utils";

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  enableTypingSound: boolean;

  initializeStore: () => Promise<void>;
  loadFromLocal: () => Promise<void>;

  addNote: (payload: { title: string; content?: string | null; pinned?: boolean; categoryId?: string | null; providerId?: string | null }) => Promise<Note | undefined>;
  updateNote: (id: string, payload: Partial<Pick<Note, "title" | "content" | "pinned" | "categoryId">>) => Promise<void>;
  togglePinNote: (noteId: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  setEnableTypingSound: (enabled: boolean) => void;
}

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
            await get().loadFromLocal();
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

          if (note.pinned) {
            const pinnedNotes = get().notes.filter((n) => n.pinned);
            await Promise.all(
              pinnedNotes.map(async (n) => {
                await db.notes.update(n.id, {
                  pinned: false,
                  updatedAt: Date.now(),
                });
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
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to update note",
            });
          }
        },

        togglePinNote: async (noteId) => {
          const note = get().notes.find((n) => n.id === noteId);
          if (!note) return;

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
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to pin note",
            });
          }
        },

        deleteNote: async (id) => {
          try {
            const deletedAt = Date.now();
            await db.notes.update(id, { deletedAt, updatedAt: deletedAt });
            set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : "Failed to delete note",
            });
          }
        },

        setEnableTypingSound: (enabled: boolean) => set({ enableTypingSound: enabled }),
      }),
      {
        name: "meelio:local:notes",
        version: 2,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ enableTypingSound: s.enableTypingSound }),
      }
    )
  )
);
