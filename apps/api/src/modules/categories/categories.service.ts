import { db } from "@/db";
import { Category, categories } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export const categoriesService = {
  /**
   * Get all categories for a user
   */
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
  },

  /**
   * Get a specific category by ID
   */
  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const category = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

    if (!category.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return category[0];
  },

  /**
   * Create a new category
   */
  async createCategory(userId: string, name: string, icon?: string): Promise<Category> {
    if (!name?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
    }

    // Check if category with same name already exists for this user
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.name, name.trim())));

    if (existing.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, "Category with this name already exists");
    }

    const result = await db
      .insert(categories)
      .values({
        userId,
        name: name.trim(),
        ...(icon?.trim() && { icon: icon.trim() }),
      })
      .returning();

    return result[0];
  },

  /**
   * Update a category
   */
  async updateCategory(
    userId: string,
    categoryId: string,
    name: string,
    icon?: string
  ): Promise<Category> {
    if (!name?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
    }

    // Verify category exists
    await this.getCategoryById(userId, categoryId);

    // Check if new name conflicts with existing category
    const existing = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.name, name.trim()),
          // Exclude current category from check
          not(eq(categories.id, categoryId))
        )
      );

    if (existing.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, "Category with this name already exists");
    }

    const result = await db
      .update(categories)
      .set({ 
        name: name.trim(), 
        ...(icon !== undefined && { icon: icon?.trim() }),
      })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return result[0];
  },

  /**
   * Delete a category
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    // Verify category exists
    await this.getCategoryById(userId, categoryId);

    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
  },
};