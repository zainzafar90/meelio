import { BaseModel } from "../db/models.dexie";

export class ConflictResolver {
  resolveConflict<T extends BaseModel>(local: T, remote: T): T {
    // If versions are the same, no conflict
    if (local._version === remote._version) {
      return local._lastModified > remote._lastModified ? local : remote;
    }

    // If one version is ahead, use that one
    if (local._version > remote._version) {
      return local;
    }
    if (remote._version > local._version) {
      return remote;
    }

    // If versions are different but neither is ahead (diverged), merge fields
    return this.mergeFields(local, remote);
  }

  private mergeFields<T extends BaseModel>(local: T, remote: T): T {
    const merged = { ...local };

    // Always take the higher version
    merged._version = Math.max(local._version, remote._version);

    // Take the more recent timestamp
    merged._lastModified = Math.max(local._lastModified, remote._lastModified);

    // Merge other fields based on last modified timestamp
    Object.keys(local).forEach((key) => {
      if (key.startsWith("_")) return; // Skip metadata fields

      if (this.shouldUseRemoteField(local, remote, key)) {
        (merged as any)[key] = (remote as any)[key];
      }
    });

    return merged;
  }

  private shouldUseRemoteField<T extends BaseModel>(
    local: T,
    remote: T,
    field: string
  ): boolean {
    // Add custom merge logic per field if needed
    // For now, use the most recent change
    return remote._lastModified > local._lastModified;
  }
}
