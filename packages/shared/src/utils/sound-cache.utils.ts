import { allSounds, pomodoroSounds } from "../data/sounds-data";
import { isChromeExtension } from "./common.utils";

// const CACHE_NAME = "meelio-sounds-v1"; // Reserved for future service worker implementation
const CACHE_EXPIRY_KEY = "meelio-sounds-cache-expiry";
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CachedSound {
  id: string;
  blob: Blob;
  url: string;
  timestamp: number;
}

class SoundCacheManager {
  private cache: Map<string, CachedSound> = new Map();
  private dbName = "meelio-sounds-db";
  private storeName = "sounds";
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initPromise = this.initDB();
    }
  }

  private async initDB(): Promise<void> {
    if (!("indexedDB" in window)) {
      console.warn("IndexedDB not supported");
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  async preloadSounds(): Promise<void> {
    if (!isChromeExtension()) {
      return; // Only preload for extension
    }

    await this.ensureInitialized();

    // Check if cache is still valid
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (cacheExpiry && Date.now() < parseInt(cacheExpiry, 10)) {
      console.log("Sound cache is still valid");
      return;
    }

    console.log("Preloading sounds for offline use...");

    const soundUrls = [
      ...allSounds.map((s) => ({ id: `sound-${s.id}`, url: s.url })),
      ...pomodoroSounds.map((s) => ({ id: s.id, url: s.url })),
    ];

    const preloadPromises = soundUrls.map(async ({ id, url }) => {
      try {
        // Check if already cached
        const cached = await this.getCachedSound(id);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return;
        }

        // Fetch and cache
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await this.cacheSound(id, blob, url);
        }
      } catch (error) {
        console.error(`Failed to preload sound ${id}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);

    // Update cache expiry
    localStorage.setItem(
      CACHE_EXPIRY_KEY,
      (Date.now() + CACHE_DURATION).toString()
    );

    console.log("Sound preloading complete");
  }

  private async cacheSound(
    id: string,
    blob: Blob,
    originalUrl: string
  ): Promise<void> {
    if (!this.db) return;

    const cachedSound: CachedSound = {
      id,
      blob,
      url: originalUrl,
      timestamp: Date.now(),
    };

    // Store in memory cache
    this.cache.set(id, cachedSound);

    // Store in IndexedDB
    try {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      await new Promise((resolve, reject) => {
        const request = store.put(cachedSound);
        request.onsuccess = resolve;
        request.onerror = reject;
      });
    } catch (error) {
      console.error("Failed to store sound in IndexedDB:", error);
    }
  }

  private async getCachedSound(id: string): Promise<CachedSound | null> {
    // Check memory cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Check IndexedDB
    if (!this.db) return null;

    try {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => {
          const result = request.result as CachedSound | undefined;
          if (result) {
            this.cache.set(id, result);
            resolve(result);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error("Failed to retrieve sound from IndexedDB:", error);
      return null;
    }
  }

  async getSoundUrl(soundId: number | string, originalUrl: string): Promise<string> {
    if (!isChromeExtension()) {
      return originalUrl; // Use original URL for web app
    }

    await this.ensureInitialized();

    const cacheId = typeof soundId === "number" ? `sound-${soundId}` : soundId;
    const cached = await this.getCachedSound(cacheId);

    if (cached && cached.blob) {
      // Create blob URL from cached data
      try {
        const blobUrl = URL.createObjectURL(cached.blob);
        // Clean up old blob URLs to prevent memory leaks
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return blobUrl;
      } catch (error) {
        console.error("Failed to create blob URL:", error);
      }
    }

    // Fallback to original URL and try to cache it
    this.cacheSoundInBackground(cacheId, originalUrl);
    return originalUrl;
  }

  private async cacheSoundInBackground(id: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        await this.cacheSound(id, blob, url);
      }
    } catch (error) {
      console.error(`Failed to cache sound ${id} in background:`, error);
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    
    if (this.db) {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      store.clear();
    }

    localStorage.removeItem(CACHE_EXPIRY_KEY);
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) return 0;

    let totalSize = 0;
    const transaction = this.db.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const sound = cursor.value as CachedSound;
          if (sound.blob) {
            totalSize += sound.blob.size;
          }
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
      request.onerror = () => resolve(0);
    });
  }
}

export const soundCacheManager = new SoundCacheManager();