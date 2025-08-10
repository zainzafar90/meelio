export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string | null; // markdown
  categoryId?: string | null;
  providerId?: string | null;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

