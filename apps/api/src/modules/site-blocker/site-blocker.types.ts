export interface CreateSiteBlockerInput {
  clientId?: string;
  url: string;
  category?: string;
}

export interface DeleteSiteBlockerInput {
  id?: string;
  clientId?: string;
}

export interface BulkSyncPayload {
  creates?: CreateSiteBlockerInput[];
  deletes?: DeleteSiteBlockerInput[];
}

export interface BulkSyncResult<T> {
  created: Array<T & { clientId?: string }>;
  updated: T[];
  deleted: string[];
}