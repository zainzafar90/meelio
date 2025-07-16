import { db } from "@/db";
import { categories } from "@/db/schema";
import { categoryService } from "./category.service";
import { ApiError } from "@/common/errors/api-error";
import httpStatus from "http-status";

// Mock the database
jest.mock("@/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("Category Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return all categories", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Productivity",
          title: "Productivity",
          description: "Focus on getting things done",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "Relax",
          title: "Relax",
          description: "Unwind and de-stress",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDbChain = {
        from: jest.fn().mockResolvedValue(mockCategories),
      };
      (db.select as jest.Mock).mockReturnValue(mockDbChain);

      const result = await categoryService.getCategories();

      expect(db.select).toHaveBeenCalled();
      expect(mockDbChain.from).toHaveBeenCalledWith(categories);
      expect(result).toEqual(mockCategories);
    });
  });

  describe("getCategoryById", () => {
    it("should return a category by id", async () => {
      const mockCategory = {
        id: "1",
        name: "Productivity",
        title: "Productivity",
        description: "Focus on getting things done",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDbChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockCategory]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockDbChain);

      const result = await categoryService.getCategoryById("1");

      expect(result).toEqual(mockCategory);
    });

    it("should throw an error if category not found", async () => {
      const mockDbChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockDbChain);

      await expect(categoryService.getCategoryById("nonexistent")).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, "Category not found")
      );
    });
  });

  describe("createCategory", () => {
    it("should create a new category", async () => {
      const newCategoryData = {
        name: "Productivity",
        title: "Productivity",
        description: "Focus on getting things done",
      };

      const createdCategory = {
        id: "1",
        ...newCategoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock checking for existing category
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      // Mock insert
      const mockInsertChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdCategory]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockInsertChain);

      const result = await categoryService.createCategory(newCategoryData);

      expect(result).toEqual(createdCategory);
    });

    it("should throw an error if category with same name exists", async () => {
      const newCategoryData = {
        name: "Productivity",
        title: "Productivity",
        description: "Focus on getting things done",
      };

      // Mock finding existing category
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: "existing" }]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      await expect(categoryService.createCategory(newCategoryData)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, "Category with this name already exists")
      );
    });
  });
});