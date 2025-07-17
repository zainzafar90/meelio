import { axios } from "./axios";

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
}

export interface UpdateCategoryDto {
  name: string;
  icon?: string;
}

export const categoryApi = {
  // Get all categories for the current user
  async getCategories(): Promise<Category[]> {
    const response = await axios.get("/v1/categories");
    return response.data;
  },

  // Get a single category by id
  async getCategory(id: string): Promise<Category> {
    const response = await axios.get(`/v1/categories/${id}`);
    return response.data;
  },

  // Create a new category
  async createCategory(category: CreateCategoryDto): Promise<Category> {
    const response = await axios.post("/v1/categories", category);
    return response.data;
  },

  // Update a category
  async updateCategory(id: string, updates: UpdateCategoryDto): Promise<Category> {
    const response = await axios.put(`/v1/categories/${id}`, updates);
    return response.data;
  },

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    await axios.delete(`/v1/categories/${id}`);
  }
};