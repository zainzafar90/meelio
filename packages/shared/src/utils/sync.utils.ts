export interface HasTimestamps {
  id?: string;
  updatedAt: number;
  deletedAt?: number | null;
}

export function now(): number {
  return Date.now();
}

export function stampUpdatedAt<T extends Partial<HasTimestamps>>(entity: T, at: number = now()): T {
  return { ...entity, updatedAt: at } as T;
}

export function softDelete<T extends Partial<HasTimestamps>>(entity: T, at: number = now()): T {
  return { ...entity, deletedAt: at, updatedAt: at } as T;
}

export function isTombstoned(entity: Partial<HasTimestamps> | undefined | null): boolean {
  return !!entity && !!entity.deletedAt;
}

/**
 * Document-level LWW merge with delete precedence.
 * Prefer "b" on ties by default (useful when b is server).
 */
export function lwwMerge<T extends HasTimestamps>(a: T, b: T, prefer: "a" | "b" = "b"): T {
  const aDel = a.deletedAt ?? 0;
  const bDel = b.deletedAt ?? 0;
  if (aDel !== bDel) return aDel > bDel ? a : b; // newer delete wins
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b; // newer update wins
  return prefer === "a" ? a : b;
}

export function lwwMergeById<T extends HasTimestamps>(
  localItems: T[],
  remoteItems: T[],
  prefer: "a" | "b" = "b"
): T[] {
  const merged = new Map<string, T>();

  const setById = (item: T) => {
    if (!item.id) return;
    merged.set(item.id, item);
  };

  // seed with local
  for (const item of localItems) setById(item);

  // merge remote
  for (const remote of remoteItems) {
    if (!remote.id) continue;
    const existing = merged.get(remote.id);
    if (!existing) {
      merged.set(remote.id, remote);
    } else {
      merged.set(remote.id, lwwMerge(existing, remote, prefer));
    }
  }

  return Array.from(merged.values());
}

