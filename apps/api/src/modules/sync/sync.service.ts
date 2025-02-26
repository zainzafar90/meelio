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
import { Mantra } from "@/db/schema/mantra.schema";
import { Background } from "@/db/schema/background.schema";

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

export interface BulkFeedOptions {
  syncTypes?: string;
  localDate?: string;
  has?: string;
  legacyBackground?: string;
}

export interface BulkFeedResponse {
  backgrounds?: Background[];
  mantras?: Mantra[];
  ts_backgrounds?: number;
  ts_mantras?: number;
  ts_quotes?: number;
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

  /**
   * Get bulk data for the feed similar to Momentum Dash
   */
  getBulkFeed: async (
    userId: string,
    options: BulkFeedOptions
  ): Promise<BulkFeedResponse> => {
    const result: BulkFeedResponse = {};

    const syncTypes = options.syncTypes
      ? options.syncTypes.split(",")
      : ["all"];

    const includeAll = syncTypes.includes("all");
    const localDate = options.localDate
      ? new Date(options.localDate)
      : new Date();

    const promises = [];

    if (includeAll || syncTypes.includes("backgrounds")) {
      promises.push(
        getBackgroundsForFeed(userId)
          .then(({ backgrounds, timestamp }) => {
            result.backgrounds = backgrounds;
            result.ts_backgrounds = timestamp;
          })
          .catch((error) => {
            console.error("Error fetching backgrounds:", error);
          })
      );
    }

    if (includeAll || syncTypes.includes("mantras")) {
      promises.push(
        getMantrasForFeed(userId)
          .then(({ mantras, timestamp }) => {
            result.mantras = mantras;
            result.ts_mantras = timestamp;
          })
          .catch((error) => {
            console.error("Error fetching mantras:", error);
          })
      );
    }

    await Promise.all(promises);

    return result;
  },
};

/**
 * Helper function to format dates for feed items
 */
function formatDates(localDate: Date): {
  dateStr: string;
  nextDateStr: string;
} {
  const dateStr = localDate.toISOString().split("T")[0];
  const nextDay = new Date(localDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDateStr = nextDay.toISOString().split("T")[0];

  return { dateStr, nextDateStr };
}

/**
 * Helper function to get mantras for the feed
 */
async function getMantrasForFeed(
  userId: string
): Promise<{ mantras: Mantra[]; timestamp: number }> {
  const now = new Date();

  try {
    const userMantras = await db
      .select()
      .from(mantras)
      .where(eq(mantras.userId, userId));

    return { mantras: userMantras, timestamp: now.getTime() };
  } catch (error) {
    console.error("Error in getMantrasForFeed:", error);
    return {
      mantras: [],
      timestamp: now.getTime(),
    };
  }
}

/**
 * Helper function to get backgrounds for the feed
 */
async function getBackgroundsForFeed(
  userId: string
): Promise<{ backgrounds: Background[]; timestamp: number }> {
  const now = new Date();

  try {
    const userBackgrounds = await db
      .select()
      .from(backgrounds)
      .where(eq(backgrounds.userId, userId));

    return { backgrounds: userBackgrounds, timestamp: now.getTime() };
  } catch (error) {
    console.error("Error in getBackgroundsForFeed:", error);
    return {
      backgrounds: [],
      timestamp: now.getTime(),
    };
  }
}
