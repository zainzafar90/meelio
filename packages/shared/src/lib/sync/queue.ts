import { v4 as uuidv4 } from "uuid";
import { BaseModel } from "../db/models";

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

  constructor() {
    this.loadQueueFromStorage();
    window.addEventListener("online", () => this.processQueue());
  }

  private loadQueueFromStorage() {
    const savedQueue = localStorage.getItem("syncQueue");
    if (savedQueue) {
      this.queue = JSON.parse(savedQueue);
    }
  }

  private saveQueueToStorage() {
    localStorage.setItem("syncQueue", JSON.stringify(this.queue));
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
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const operation = this.queue[0];
      await this.processSyncOperation(operation);
      this.queue.shift();
      this.saveQueueToStorage();
    } catch (error) {
      const operation = this.queue[0];
      operation.retries++;

      if (operation.retries >= this.maxRetries) {
        this.queue.shift();
        // TODO: Handle failed operation (e.g., add to error log)
      }

      this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  private async processSyncOperation(operation: SyncOperation) {
    const endpoint = `/api/${operation.entity}`;
    const method =
      operation.operation === "delete"
        ? "DELETE"
        : operation.operation === "create"
          ? "POST"
          : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(operation.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    this.saveQueueToStorage();
  }
}
