export interface CalendarToken {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
}

export interface TokenStore {
  get(userId: string): Promise<CalendarToken | null>;
  set(userId: string, token: CalendarToken): Promise<void>;
  update(userId: string, token: Partial<CalendarToken>): Promise<void>;
}

/**
 * In-memory token store for examples. Replace with DB in production.
 */
export class MemoryTokenStore implements TokenStore {
  private store = new Map<string, CalendarToken>();

  async get(userId: string): Promise<CalendarToken | null> {
    return this.store.get(userId) ?? null;
  }

  async set(userId: string, token: CalendarToken): Promise<void> {
    this.store.set(userId, token);
  }

  async update(userId: string, token: Partial<CalendarToken>): Promise<void> {
    const existing = this.store.get(userId);
    if (!existing) return;
    this.store.set(userId, { ...existing, ...token });
  }
}
