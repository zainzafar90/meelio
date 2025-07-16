import { db } from "@/db";
import { Category, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import httpStatus from "http-status";
import { ApiError } from "@/common/errors/api-error";

interface CreateCategoryData {
  name: string;
  title: string;
  description: string;
}

interface UpdateCategoryData {
  title?: string;
  description?: string;
}

export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  },

  /**
   * Get a category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return category;
  },

  /**
   * Get a category by name
   */
  async getCategoryByName(name: string): Promise<Category> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name as any));

    if (!category) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return category;
  },

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    // Check if category with same name already exists
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, data.name as any));

    if (existing.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category with this name already exists");
    }

    const [category] = await db
      .insert(categories)
      .values(data as any)
      .returning();

    return category;
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();

    if (!updatedCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    return updatedCategory;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));

    if (result.rowCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }
  },
};