export interface IOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectBy?: string;
  populate?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
