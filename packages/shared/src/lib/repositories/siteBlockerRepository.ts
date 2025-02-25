import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { BaseModel, SiteBlocker } from "../db/models";
import { SyncQueue } from "../sync/queue";
import { ConflictResolver } from "../sync/conflictResolver";

export class SiteBlockerRepository {
  private syncQueue: SyncQueue;
  private conflictResolver: ConflictResolver;

  constructor() {
    this.syncQueue = new SyncQueue();
    this.conflictResolver = new ConflictResolver();
  }

  async create(data: Omit<SiteBlocker, keyof BaseModel>): Promise<SiteBlocker> {
    const now = Date.now();
    const siteBlocker: SiteBlocker = {
      ...data,
      id: uuidv4(),
      _syncStatus: "pending",
      _lastModified: now,
      _version: 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.siteBlocker.add(siteBlocker);

    this.syncQueue.addOperation({
      operation: "create",
      entity: "site-blockers",
      data: siteBlocker,
      version: siteBlocker._version,
    });

    return siteBlocker;
  }

  async update(id: string, data: Partial<SiteBlocker>): Promise<SiteBlocker> {
    const existing = await db.siteBlocker.get(id);
    if (!existing) {
      throw new Error("Site blocker not found");
    }

    const updated: SiteBlocker = {
      ...existing,
      ...data,
      _syncStatus: "pending",
      _lastModified: Date.now(),
      _version: existing._version + 1,
      updatedAt: Date.now(),
    };

    await db.siteBlocker.put(updated);

    this.syncQueue.addOperation({
      operation: "update",
      entity: "site-blockers",
      data: updated,
      version: updated._version,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await db.siteBlocker.get(id);
    if (!existing) {
      throw new Error("Site blocker not found");
    }

    await db.siteBlocker.delete(id);

    this.syncQueue.addOperation({
      operation: "delete",
      entity: "site-blockers",
      data: { id },
      version: existing._version,
    });
  }

  async getById(id: string): Promise<SiteBlocker | undefined> {
    return db.siteBlocker.get(id);
  }

  async getAll(): Promise<SiteBlocker[]> {
    return db.siteBlocker.toArray();
  }

  async handleSync(remoteData: SiteBlocker): Promise<void> {
    const local = await db.siteBlocker.get(remoteData.id);

    if (!local) {
      // If no local version exists, just add the remote version
      await db.siteBlocker.add({
        ...remoteData,
        _syncStatus: "synced",
      });
      return;
    }

    if (local._syncStatus === "pending") {
      // Local changes pending, resolve conflict
      const resolved = this.conflictResolver.resolveConflict(local, remoteData);
      await db.siteBlocker.put({
        ...resolved,
        _syncStatus: "synced",
      });
    } else {
      // No local changes, update with remote data
      await db.siteBlocker.put({
        ...remoteData,
        _syncStatus: "synced",
      });
    }
  }
}
