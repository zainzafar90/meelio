import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import type { Background, BaseModel } from "../db/models";
import { SyncQueue } from "../sync/queue";
import { ConflictResolver } from "../sync/conflictResolver";
import { defaultBackgrounds } from "../data/defaultBackgrounds";
import {
  getBackgrounds,
  createBackground as createBackgroundApi,
  updateBackground as updateBackgroundApi,
  deleteBackground as deleteBackgroundApi,
} from "../../api/backgrounds.api";

export class BackgroundRepository {
  private syncQueue: SyncQueue;
  private conflictResolver: ConflictResolver;
  private initialized: boolean = false;

  constructor() {
    this.syncQueue = new SyncQueue();
    this.conflictResolver = new ConflictResolver();
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // First, check if we have any backgrounds in IndexedDB
      const existingBackgrounds = await db.backgrounds.count();

      if (existingBackgrounds === 0) {
        // If no backgrounds exist, add defaults first
        const defaultsToAdd = defaultBackgrounds.map((bg) => ({
          ...bg,
          _syncStatus: "synced" as const,
          userId: "default",
        }));
        await db.backgrounds.bulkAdd(defaultsToAdd);
      }

      // Try to fetch from API if online
      if (navigator.onLine) {
        await this.fetchFromAPI();
      }

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing backgrounds:", error);
      // If API fetch fails, we still have defaults
      this.initialized = true;
    }
  }

  private async fetchFromAPI() {
    try {
      const { data: backgrounds } = await getBackgrounds();

      // Process each background
      for (const background of backgrounds) {
        const existing = await db.backgrounds.get(background.id);

        if (!existing) {
          // New background, add it
          await db.backgrounds.add({
            ...background,
            _syncStatus: "synced",
            _lastModified: Date.now(),
          });
        } else if (background._version > existing._version) {
          // Server has newer version
          await db.backgrounds.put({
            ...background,
            _syncStatus: "synced",
            _lastModified: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching backgrounds from API:", error);
      throw error;
    }
  }

  async create(data: Omit<Background, keyof BaseModel>): Promise<Background> {
    await this.initialize();

    const background: Background = {
      ...data,
      id: uuidv4(),
      _syncStatus: "pending",
      _lastModified: Date.now(),
      _version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.backgrounds.add(background);

    if (navigator.onLine) {
      try {
        const { data: serverBackground } = await createBackgroundApi(data);
        await db.backgrounds.put({
          ...serverBackground,
          _syncStatus: "synced",
          _lastModified: Date.now(),
        });
        return serverBackground;
      } catch (error) {
        console.error("Error creating background on server:", error);
      }
    }

    // If offline or API call failed, add to sync queue
    this.syncQueue.addOperation({
      operation: "create",
      entity: "backgrounds",
      data: background,
      version: background._version,
    });

    return background;
  }

  async update(id: string, data: Partial<Background>): Promise<Background> {
    await this.initialize();

    const background = await db.backgrounds.get(id);
    if (!background) {
      throw new Error(`Background with id ${id} not found`);
    }

    // Don't allow modifying default backgrounds except for favorite status
    if (background.id.startsWith("default-")) {
      const updatedBackground: Background = {
        ...background,
        isFavorite: data.isFavorite ?? background.isFavorite,
        _lastModified: Date.now(),
        _version: background._version + 1,
        updatedAt: Date.now(),
      };
      await db.backgrounds.put(updatedBackground);
      return updatedBackground;
    }

    const updatedBackground: Background = {
      ...background,
      ...data,
      _syncStatus: "pending",
      _lastModified: Date.now(),
      _version: background._version + 1,
      updatedAt: Date.now(),
    };

    await db.backgrounds.put(updatedBackground);

    if (navigator.onLine) {
      try {
        const { data: serverBackground } = await updateBackgroundApi(id, data);
        await db.backgrounds.put({
          ...serverBackground,
          _syncStatus: "synced",
          _lastModified: Date.now(),
        });
        return serverBackground;
      } catch (error) {
        console.error("Error updating background on server:", error);
      }
    }

    // If offline or API call failed, add to sync queue
    this.syncQueue.addOperation({
      operation: "update",
      entity: "backgrounds",
      data: updatedBackground,
      version: updatedBackground._version,
    });

    return updatedBackground;
  }

  async delete(id: string): Promise<void> {
    await this.initialize();

    const background = await this.getById(id);
    if (!background) {
      throw new Error(`Background with id ${id} not found`);
    }

    if (background.id.startsWith("default-")) {
      throw new Error("Cannot delete default backgrounds");
    }

    await db.backgrounds.delete(id);

    if (navigator.onLine) {
      try {
        await deleteBackgroundApi(id);
        return;
      } catch (error) {
        console.error("Error deleting background on server:", error);
      }
    }

    // If offline or API call failed, add to sync queue
    this.syncQueue.addOperation({
      operation: "delete",
      entity: "backgrounds",
      data: { id },
      version: background._version,
    });
  }

  async getById(id: string): Promise<Background | undefined> {
    await this.initialize();
    return db.backgrounds.get(id);
  }

  async getAll(): Promise<Background[]> {
    await this.initialize();
    return db.backgrounds.toArray();
  }

  async getByUserId(userId: string): Promise<Background[]> {
    await this.initialize();

    // Always include default backgrounds along with user's backgrounds
    const [userBackgrounds, defaultBgs] = await Promise.all([
      db.backgrounds.where("userId").equals(userId).toArray(),
      db.backgrounds.where("userId").equals("default").toArray(),
    ]);

    return [...defaultBgs, ...userBackgrounds];
  }

  async getFavorites(userId: string): Promise<Background[]> {
    await this.initialize();

    // Include favorited default backgrounds
    const [userFavorites, defaultFavorites] = await Promise.all([
      db.backgrounds
        .where("userId")
        .equals(userId)
        .and((item) => item.isFavorite)
        .toArray(),
      db.backgrounds
        .where("userId")
        .equals("default")
        .and((item) => item.isFavorite)
        .toArray(),
    ]);

    return [...defaultFavorites, ...userFavorites];
  }

  async getByCategory(category: string): Promise<Background[]> {
    await this.initialize();
    return db.backgrounds.where("category").equals(category).toArray();
  }

  async sync(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      // First, process any pending operations in the sync queue
      await this.syncQueue.processQueue();

      // Then fetch latest from API
      await this.fetchFromAPI();
    } catch (error) {
      console.error("Error syncing backgrounds:", error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      // Delete all non-default backgrounds
      await db.backgrounds
        .where("id")
        .noneOf(defaultBackgrounds.map((bg) => bg.id))
        .delete();

      // Reset default backgrounds
      const defaultsToAdd = defaultBackgrounds.map((bg) => ({
        ...bg,
        _syncStatus: "synced" as const,
        userId: "default",
        isFavorite: false, // Reset favorite status
      }));

      await db.backgrounds.where("id").startsWith("default-").delete();
      await db.backgrounds.bulkAdd(defaultsToAdd);

      // Reset initialized state to force a fresh fetch
      this.initialized = false;
      await this.initialize();
    } catch (error) {
      console.error("Error resetting to default backgrounds:", error);
      throw error;
    }
  }
}
