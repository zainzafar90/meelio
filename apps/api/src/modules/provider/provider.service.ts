import { db } from "@/db";
import { Provider, providers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateProviderData {
  name: string;
  displayName: string;
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

interface UpdateProviderData {
  displayName?: string;
  enabled?: boolean;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

export const providerService = {
  /**
   * Get all providers
   */
  async getProviders(includeDisabled = false): Promise<Provider[]> {
    if (includeDisabled) {
      return db.select().from(providers);
    }
    
    return db
      .select()
      .from(providers)
      .where(eq(providers.enabled, true));
  },

  /**
   * Get a provider by ID
   */
  async getProviderById(id: string): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, id));

    if (!provider) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
    }

    return provider;
  },

  /**
   * Get a provider by name
   */
  async getProviderByName(name: string): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.name, name));

    if (!provider) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
    }

    return provider;
  },

  /**
   * Get enabled provider by name
   */
  async getEnabledProviderByName(name: string): Promise<Provider> {
    const [provider] = await db
      .select()
      .from(providers)
      .where(and(eq(providers.name, name), eq(providers.enabled, true)));

    if (!provider) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found or disabled");
    }

    return provider;
  },

  /**
   * Create a new provider
   */
  async createProvider(data: CreateProviderData): Promise<Provider> {
    // Check if provider with same name already exists
    const existing = await db
      .select()
      .from(providers)
      .where(eq(providers.name, data.name));

    if (existing.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Provider with this name already exists");
    }

    const [provider] = await db
      .insert(providers)
      .values(data)
      .returning();

    return provider;
  },

  /**
   * Update a provider
   */
  async updateProvider(id: string, data: UpdateProviderData): Promise<Provider> {
    const [updatedProvider] = await db
      .update(providers)
      .set(data)
      .where(eq(providers.id, id))
      .returning();

    if (!updatedProvider) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
    }

    return updatedProvider;
  },

  /**
   * Delete a provider
   */
  async deleteProvider(id: string): Promise<void> {
    const result = await db
      .delete(providers)
      .where(eq(providers.id, id));

    if (result.rowCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
    }
  },

  /**
   * Enable or disable a provider
   */
  async toggleProviderStatus(id: string, enabled: boolean): Promise<Provider> {
    const updateData: Partial<Provider> = { enabled };
    
    const [updatedProvider] = await db
      .update(providers)
      .set(updateData)
      .where(eq(providers.id, id))
      .returning();

    if (!updatedProvider) {
      throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
    }

    return updatedProvider;
  },
};