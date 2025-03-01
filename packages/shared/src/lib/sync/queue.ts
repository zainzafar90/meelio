import { v4 as uuidv4 } from "uuid";
import { BaseModel } from "../db/models.dexie";
import { api } from "../../api";
import { axios } from "../../api/axios";
import { useAuthStore } from "../../stores/auth.store";

export type SyncOperation = {
  id: string;
  operation: "create" | "update" | "delete";
  entity: string;
  data: Partial<BaseModel>;
  timestamp: number;
  retries: number;
  version: number;
};

export class SyncQueue {
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private SYNC_KEY = "meelio:sync-queue";

  constructor() {
    this.loadQueueFromStorage();
    window.addEventListener("online", () => this.processQueue());
  }

  private loadQueueFromStorage() {
    const savedQueue = localStorage.getItem(this.SYNC_KEY);
    if (savedQueue) {
      this.queue = JSON.parse(savedQueue);
    }
  }

  private saveQueueToStorage() {
    localStorage.setItem(this.SYNC_KEY, JSON.stringify(this.queue));
  }

  addOperation(operation: Omit<SyncOperation, "id" | "timestamp" | "retries">) {
    const syncOp: SyncOperation = {
      ...operation,
      id: uuidv4(),
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(syncOp);
    this.saveQueueToStorage();
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (
      !useAuthStore.getState().guestUser?.name &&
      !useAuthStore.getState().user?.name
    ) {
      this.queue = [];
      this.saveQueueToStorage();
      return;
    }

    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      // If we have multiple operations, use the bulk sync endpoint
      if (this.queue.length > 1) {
        await this.processBulkSync();
        // No need to shift or modify queue here as processBulkSync handles that
      } else {
        // Otherwise process a single operation
        const operation = this.queue[0];
        await this.processSyncOperation(operation);
        this.queue.shift();
      }
      this.saveQueueToStorage();
    } catch (error) {
      console.error("Sync error:", error);
      if (this.queue.length === 1) {
        const operation = this.queue[0];
        if (operation) {
          operation.retries++;
          if (operation.retries >= this.maxRetries) {
            this.queue.shift();
            // TODO: Handle failed operation (e.g., add to error log)
          }
        }
      }
      this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
      // Only continue processing if there are still items in the queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private async processBulkSync() {
    try {
      // Format operations for the bulk sync endpoint
      const operations = this.queue.map((op) => ({
        entity: op.entity,
        operation: op.operation,
        data: op.data,
        clientId: op.id,
        timestamp: new Date(op.timestamp),
      }));

      // Get the last sync timestamp (use the oldest operation in the queue)
      const lastSyncTimestamp = new Date(
        Math.min(...this.queue.map((op) => op.timestamp))
      );

      // Call the bulk sync endpoint
      const response = await axios.post("/v1/sync/bulk", {
        operations,
        lastSyncTimestamp,
      });

      if (response.data.success) {
        // Clear the queue if successful
        this.queue = [];
      } else {
        // Handle conflicts
        const conflictIds = response.data.conflicts.map((c) => c.clientId);
        // Keep only the operations that had conflicts
        this.queue = this.queue.filter((op) => conflictIds.includes(op.id));

        // Increment retry count for conflicts
        this.queue.forEach((op) => {
          if (conflictIds.includes(op.id)) {
            op.retries++;
          }
        });

        // Remove operations that have exceeded max retries
        this.queue = this.queue.filter((op) => op.retries < this.maxRetries);
      }
    } catch (error) {
      console.error("Bulk sync failed:", error);
      throw error;
    }
  }

  private async processSyncOperation(operation: SyncOperation) {
    try {
      // Use the appropriate API based on the entity
      switch (operation.entity) {
        case "focus-sessions":
          return await this.processFocusSessionOperation(operation);
        // Add cases for other entities as needed
        default:
          return await this.processGenericOperation(operation);
      }
    } catch (error) {
      console.error(`Error processing ${operation.entity} operation:`, error);
      throw error;
    }
  }

  private async processFocusSessionOperation(operation: SyncOperation) {
    switch (operation.operation) {
      case "create":
        return await api.focusSessions.createFocusSession({
          sessionStart: (operation.data as any).sessionStart,
          sessionEnd: (operation.data as any).sessionEnd,
          duration: (operation.data as any).duration,
        });
      case "update":
        return await api.focusSessions.updateFocusSession(
          operation.data.id as string,
          operation.data as any
        );
      case "delete":
        return await api.focusSessions.deleteFocusSession(
          operation.data.id as string
        );
      default:
        throw new Error(`Unknown operation: ${operation.operation}`);
    }
  }

  private async processGenericOperation(operation: SyncOperation) {
    // Convert entity name to kebab-case for API endpoint
    const entityPath = operation.entity
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    const endpoint = `/v1/${entityPath}`;

    // For specific entity operations, handle ID in the URL
    const isIdOperation =
      operation.operation === "update" || operation.operation === "delete";
    const finalEndpoint =
      isIdOperation && operation.data.id
        ? `${endpoint}/${operation.data.id}`
        : endpoint;

    const method =
      operation.operation === "delete"
        ? "DELETE"
        : operation.operation === "create"
          ? "POST"
          : "PATCH";

    return await axios({
      method,
      url: finalEndpoint,
      data: method !== "DELETE" ? operation.data : undefined,
    });
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    this.saveQueueToStorage();
  }
}
