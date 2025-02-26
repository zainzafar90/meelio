import { db } from "@/db";
import {
  users,
  backgrounds,
  soundscapes,
  mantras,
  tasks,
  pomodoroSettings,
  siteBlockers,
  tabStashes,
  notes,
  weatherCache,
  focusSessions,
} from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export interface SyncOperation {
  entity: string;
  operation: "create" | "update" | "delete";
  data: any;
  clientId: string;
  timestamp: Date;
}

export interface SyncRequest {
  userId: string;
  operations: SyncOperation[];
  lastSyncTimestamp?: Date;
}

export interface SyncResponse {
  success: boolean;
  timestamp: Date;
  conflicts: SyncOperation[];
  serverChanges: SyncOperation[];
}

export const syncService = {
  getTableForEntity: (entity: string) => {
    switch (entity) {
      case "users":
        return users;
      case "backgrounds":
        return backgrounds;
      case "soundscapes":
        return soundscapes;
      case "mantras":
        return mantras;
      case "tasks":
        return tasks;
      case "pomodoroSettings":
        return pomodoroSettings;
      case "siteBlockers":
        return siteBlockers;
      case "tabStashes":
        return tabStashes;
      case "notes":
        return notes;
      case "weatherCache":
        return weatherCache;
      case "focusSessions":
        return focusSessions;
      default:
        throw new ApiError(httpStatus.BAD_REQUEST, `Unknown entity: ${entity}`);
    }
  },

  processSync: async (syncRequest: SyncRequest): Promise<SyncResponse> => {
    const { userId, operations, lastSyncTimestamp } = syncRequest;
    const conflicts: SyncOperation[] = [];
    const serverChanges: SyncOperation[] = [];
    const now = new Date();

    // Process each operation
    for (const operation of operations) {
      try {
        const table = syncService.getTableForEntity(operation.entity);

        // Skip user table for special handling if needed
        if (operation.entity === "users") {
          continue;
        }

        switch (operation.operation) {
          case "create":
            await db.insert(table).values({
              ...operation.data,
              userId,
              createdAt: now,
              updatedAt: now,
            });
            break;

          case "update":
            await db
              .update(table)
              .set({
                ...operation.data,
                updatedAt: now,
              })
              .where(
                and(
                  eq(table.id as any, operation.data.id),
                  eq((table as any).userId, userId)
                )
              );
            break;

          case "delete":
            await db
              .delete(table)
              .where(
                and(
                  eq(table.id as any, operation.data.id),
                  eq((table as any).userId, userId)
                )
              );
            break;
        }
      } catch (error) {
        conflicts.push(operation);
      }
    }

    // Get server changes since last sync
    if (lastSyncTimestamp) {
      for (const entityName of [
        "backgrounds",
        "soundscapes",
        "mantras",
        "tasks",
        "pomodoroSettings",
        "siteBlockers",
        "tabStashes",
        "notes",
        "weatherCache",
        "breathepod",
        "focusSessions",
      ]) {
        const table = syncService.getTableForEntity(entityName);
        const changes = await db
          .select()
          .from(table)
          .where(
            and(
              eq((table as any).userId, userId),
              gt(table.updatedAt as any, lastSyncTimestamp)
            )
          );

        for (const change of changes) {
          serverChanges.push({
            entity: entityName,
            operation: "update",
            data: change,
            clientId: "server",
            timestamp: change.updatedAt,
          });
        }
      }
    }

    return {
      success: conflicts.length === 0,
      timestamp: now,
      conflicts,
      serverChanges,
    };
  },

  getSyncStatus: async (userId: string): Promise<{ timestamp: Date }> => {
    return {
      timestamp: new Date(),
    };
  },
};
