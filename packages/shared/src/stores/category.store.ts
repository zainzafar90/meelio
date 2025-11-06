import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api";
import { db } from "../lib/db/meelio.dexie";
import { useAuthStore } from "./auth.store";
import { generateUUID } from "../utils/common.utils";

type LocalCategory = {
  id: string;
  userId: string | null;
  name: string;
  icon?: string;
  type: "system" | "user";
  createdAt: number;
  updatedAt: number;
};

interface CategoryState {
  categories: LocalCategory[];
  isLoading: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  createCategory: (data: { name: string; icon?: string }) => Promise<LocalCategory>;
  updateCategory: (id: string, data: { name: string; icon?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => LocalCategory | undefined;
  reset: () => void;
}


export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      loadCategories: async () => {
        const state = get();
        if (state.isLoading) return;

        const { user, guestUser } = useAuthStore.getState();
        const isGuest = !!guestUser && !user;
        const userId = user?.id || guestUser?.id;

        if (!userId) {
          set({ error: "No user found" });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          let categories: LocalCategory[];

          if (isGuest) {
            categories = await db.categories.where("userId").equals(userId).toArray() as LocalCategory[];
          } else {
            const apiCats = await api.categories.categoryApi.getCategories();
            categories = apiCats.map(cat => ({
              ...cat,
              createdAt: new Date(cat.createdAt).getTime(),
              updatedAt: new Date(cat.updatedAt).getTime(),
            })) as LocalCategory[];
          }

          set({ categories, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Failed to load categories",
            isLoading: false
          });
        }
      },

      createCategory: async (data: { name: string; icon?: string }) => {
        const { user, guestUser } = useAuthStore.getState();
        const isGuest = !!guestUser && !user;
        const userId = user?.id || guestUser?.id;

        if (!userId) throw new Error("No user found");
        if (!data.name.trim()) throw new Error("Name is required");

        const existing = get().categories.find(c => c.name.toLowerCase() === data.name.trim().toLowerCase());
        if (existing) throw new Error("Category exists");

        const newCat: LocalCategory = {
          id: generateUUID(),
          userId,
          name: data.name.trim(),
          icon: data.icon,
          type: "user",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (isGuest) {
          await db.categories.add(newCat);
        } else {
          const created = await api.categories.categoryApi.createCategory({
            name: newCat.name,
            icon: newCat.icon
          });
          newCat.id = created.id;
          newCat.userId = created.userId;
          newCat.icon = created.icon;
          newCat.type = created.type;
          newCat.createdAt = new Date(created.createdAt).getTime();
          newCat.updatedAt = new Date(created.updatedAt).getTime();
        }

        set(state => ({ categories: [...state.categories, newCat] }));
        return newCat;
      },

      updateCategory: async (id: string, data: { name: string; icon?: string }) => {
        const { user, guestUser } = useAuthStore.getState();
        const isGuest = !!guestUser && !user;
        const userId = user?.id || guestUser?.id;

        if (!userId) throw new Error("No user found");

        const cat = get().getCategoryById(id);
        if (!cat) throw new Error("Category not found");

        const updates = {
          name: data.name.trim(),
          icon: data.icon,
          updatedAt: Date.now()
        };

        if (isGuest) {
          await db.categories.update(id, updates);
        } else {
          await api.categories.categoryApi.updateCategory(id, {
            name: updates.name,
            icon: updates.icon
          });
        }

        set(state => ({
          categories: state.categories.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }));
      },

      deleteCategory: async (id: string) => {
        const { user, guestUser } = useAuthStore.getState();
        const isGuest = !!guestUser && !user;

        if (isGuest) {
          await db.categories.delete(id);
        } else {
          await api.categories.categoryApi.deleteCategory(id);
        }

        set(state => ({
          categories: state.categories.filter(c => c.id !== id)
        }));
      },

      getCategoryById: (id: string) => {
        return get().categories.find(cat => cat.id === id);
      },

      reset: () => {
        set({ categories: [], isLoading: false, error: null });
      }
    }),
    {
      name: "meelio:local:categories",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);