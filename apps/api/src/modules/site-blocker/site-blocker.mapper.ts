import { SiteBlocker } from "@/db/schema/site-blocker.schema";

export interface SiteBlockerDto {
  id: string;
  url: string;
  category?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: string;
  clientId?: string;
}

export const siteBlockerMapper = {
  toDto(entity: SiteBlocker & { clientId?: string }): SiteBlockerDto {
    const { id, url, category, enabled, createdAt, updatedAt, deletedAt, userId, clientId } = entity as any;
    
    return {
      id,
      url,
      category,
      isBlocked: !!enabled,
      createdAt: createdAt?.toISOString?.() ?? createdAt,
      updatedAt: updatedAt?.toISOString?.() ?? updatedAt,
      deletedAt: deletedAt ? deletedAt?.toISOString?.() : null,
      userId,
      ...(clientId && { clientId }),
    };
  },

  toDtoArray(entities: SiteBlocker[]): SiteBlockerDto[] {
    return entities.map(entity => this.toDto(entity));
  }
};