import { db } from "@/db";
import { Category, CategoryInsert, categories } from "@/db/schema";
import { eq, and, not, or, isNull } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

export const categoriesService = {
  /**
   * Get all categories for a user (includes system categories + user categories)
   */
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(
        or(
          and(eq(categories.userId, userId), eq(categories.type, "user")),
          and(isNull(categories.userId), eq(categories.type, "system"))
        )
      )
      .orderBy(categories.type, categories.name);
  },

  /**
   * Get a specific category by ID (allows access to system categories)
   */
  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          or(
            and(eq(categories.userId, userId), eq(categories.type, "user")),
            and(isNull(categories.userId), eq(categories.type, "system"))
          )
        )
      );

    if (!category.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return category[0];
  },

  /**
   * Create a new category (only creates user categories)
   */
  async createCategory(userId: string, name: string, icon?: string): Promise<Category> {
    if (!name?.trim()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category name is required");
    }

    // Check if category with same name already exists for this user (including system categories)
    const existing = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.name, name.trim()),
          or(
            and(eq(categories.userId, userId), eq(categories.type, "user")),
            and(isNull(categories.userId), eq(categories.type, "system"))
          )
        )
      );

    if (existing.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, "Category with this name already exists");
    }

    const result = await db
      .insert(categories)
      .values({
        userId,
        name: name.trim(),
        type: "user",
        ...(icon?.trim() && { icon: icon.trim() }),
      } as CategoryInsert)
      .returning();

    return result[0];
  },

  /**
   * Update a category (only allows updating user categories)
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

    // Verify category exists and is owned by user
    const category = await this.getCategoryById(userId, categoryId);
    
    // Only allow updating user categories, not system categories
    if (category.type === "system") {
      throw new ApiError(httpStatus.FORBIDDEN, "Cannot update system categories");
    }

    // Check if new name conflicts with existing category (including system categories)
    const existing = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.name, name.trim()),
          or(
            and(eq(categories.userId, userId), eq(categories.type, "user")),
            and(isNull(categories.userId), eq(categories.type, "system"))
          ),
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
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), eq(categories.type, "user")))
      .returning();

    if (!result.length) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found or cannot be updated");
    }

    return result[0];
  },

  /**
   * Delete a category (only allows deleting user categories)
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    // Verify category exists and is owned by user
    const category = await this.getCategoryById(userId, categoryId);
    
    // Only allow deleting user categories, not system categories
    if (category.type === "system") {
      throw new ApiError(httpStatus.FORBIDDEN, "Cannot delete system categories");
    }

    await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId), eq(categories.type, "user")));
  },
};