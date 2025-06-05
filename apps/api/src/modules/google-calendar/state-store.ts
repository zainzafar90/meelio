export interface StateStore {
  create(userId: string): Promise<string>;
  consume(state: string): Promise<string | null>;
}

import crypto from "crypto";

/**
 * In-memory store only for examples. Use a durable store in prod.
 */
export class MemoryStateStore implements StateStore {
  private map = new Map<string, string>();

  async create(userId: string): Promise<string> {
    const state = crypto.randomUUID();
    this.map.set(state, userId);
    return state;
  }

  async consume(state: string): Promise<string | null> {
    const user = this.map.get(state) ?? null;
    if (user) this.map.delete(state);
    return user;
  }
}
