import { db } from "@/db";
import { providers } from "@/db/schema";
import { providerService } from "./provider.service";
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

describe("Provider Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProviders", () => {
    it("should return only enabled providers by default", async () => {
      const mockProviders = [
        {
          id: "1",
          name: "google",
          displayName: "Google",
          enabled: true,
          clientId: "client123",
          clientSecret: "secret123",
          scopes: ["email", "profile"],
          authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDbChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProviders),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockDbChain);

      const result = await providerService.getProviders();

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockProviders);
    });

    it("should return all providers when includeDisabled is true", async () => {
      const mockProviders = [
        {
          id: "1",
          name: "google",
          displayName: "Google",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "facebook",
          displayName: "Facebook",
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDbChain = {
        from: jest.fn().mockResolvedValue(mockProviders),
      };
      (db.select as jest.Mock).mockReturnValue(mockDbChain);

      const result = await providerService.getProviders(true);

      expect(result).toEqual(mockProviders);
    });
  });

  describe("toggleProviderStatus", () => {
    it("should enable a disabled provider", async () => {
      const updatedProvider = {
        id: "1",
        name: "google",
        displayName: "Google",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDbChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      };
      (db.update as jest.Mock).mockReturnValue(mockDbChain);

      const result = await providerService.toggleProviderStatus("1", true);

      expect(result).toEqual(updatedProvider);
      expect(mockDbChain.set).toHaveBeenCalledWith({ enabled: true });
    });

    it("should throw an error if provider not found", async () => {
      const mockDbChain = {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.update as jest.Mock).mockReturnValue(mockDbChain);

      await expect(providerService.toggleProviderStatus("nonexistent", true)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, "Provider not found")
      );
    });
  });

  describe("createProvider", () => {
    it("should create a new provider", async () => {
      const newProviderData = {
        name: "github",
        displayName: "GitHub",
        enabled: true,
        clientId: "client456",
        clientSecret: "secret456",
        scopes: ["user", "repo"],
        authUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        userInfoUrl: "https://api.github.com/user",
      };

      const createdProvider = {
        id: "2",
        ...newProviderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock checking for existing provider
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      // Mock insert
      const mockInsertChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdProvider]),
        }),
      };
      (db.insert as jest.Mock).mockReturnValue(mockInsertChain);

      const result = await providerService.createProvider(newProviderData);

      expect(result).toEqual(createdProvider);
    });

    it("should throw an error if provider with same name exists", async () => {
      const newProviderData = {
        name: "google",
        displayName: "Google",
      };

      // Mock finding existing provider
      const mockSelectChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ id: "existing" }]),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      await expect(providerService.createProvider(newProviderData)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, "Provider with this name already exists")
      );
    });
  });
});