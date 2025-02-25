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
  breathepod,
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

/**
 * Get the table for a given entity
 * @param {string} entity - The entity name
 * @returns {object} The table object
 */
const getTableForEntity = (entity: string) => {
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
    case "breathepod":
      return breathepod;
    case "focusSessions":
      return focusSessions;
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, `Unknown entity: ${entity}`);
  }
};

/**
 * Process a sync request
 * @param {SyncRequest} syncRequest - The sync request
 * @returns {Promise<SyncResponse>} The sync response
 */
export const processSync = async (
  syncRequest: SyncRequest
): Promise<SyncResponse> => {
  const { userId, operations, lastSyncTimestamp } = syncRequest;
  const conflicts: SyncOperation[] = [];
  const serverChanges: SyncOperation[] = [];
  const now = new Date();

  // Process client operations
  for (const operation of operations) {
    try {
      const table = getTableForEntity(operation.entity);

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
      const table = getTableForEntity(entityName);
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
};

/**
 * Get the current sync status
 * @param {string} userId - The user ID
 * @returns {Promise<{timestamp: Date}>} The sync status
 */
export const getSyncStatus = async (
  userId: string
): Promise<{ timestamp: Date }> => {
  return {
    timestamp: new Date(),
  };
};
