import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "@/utils/catch-async";
import { pick } from "@/utils/pick";
import { ApiError } from "@/common/errors/api-error";

import { permissionService } from "../permissions/permission.service";
import * as userService from "./user.service";
import {
  UserDeleteResponse,
  UserListResponse,
  UserProfileResponse,
  UserResponse,
} from "@/types/api/api-responses";
import { IUser } from "@/types/interfaces/resources";
import { IOptions } from "@/types/interfaces/pagination";

export const createUser = catchAsync(
  async (req: Request, res: Response<UserResponse>) => {
    const user = req.user as IUser;

    const isAllowed = permissionService.checkPermissions(
      user.role,
      "create",
      "users"
    );
    if (!isAllowed) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to create users"
      );
    }

    const createdUser = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send(createdUser as IUser);
  }
);

export const getUsers = catchAsync(
  async (req: Request, res: Response<UserListResponse>) => {
    const user = req.user as IUser;
    const filter = pick(req.query, ["name", "roles"]);
    const options: IOptions = pick(req.query, [
      "sortBy",
      "sortOrder",
      "limit",
      "offset",
      "projectBy",
    ]);
    const isAllowed = permissionService.checkPermissions(
      user.role,
      "list",
      "users"
    );
    if (!isAllowed) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to list users"
      );
    }

    const result = await userService.queryUsers(filter, options);
    res.send(result as UserListResponse);
  }
);

export const getMe = catchAsync(
  async (req: Request, res: Response<UserProfileResponse>) => {
    const user = await userService.getMe(req.user["id"]);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (req.user["id"] !== user["id"]) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You can only get your own profile"
      );
    }

    res.send(user as UserProfileResponse);
  }
);

export const getUser = catchAsync(
  async (req: Request, res: Response<UserResponse>) => {
    if (typeof req.params["userId"] === "string") {
      const user = await userService.getUserById(req.params["userId"]);
      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
      }
      res.send(user as UserResponse);
    }
  }
);

export const updateUser = catchAsync(
  async (req: Request, res: Response<UserResponse>) => {
    if (typeof req.params["userId"] === "string") {
      const userId = req.params["userId"];
      const currentUser = req.user as IUser;

      const isAllowed = permissionService.checkPermissions(
        currentUser.role,
        "update",
        "users"
      );
      if (!isAllowed) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to update users"
        );
      }

      if (userId !== currentUser["id"]) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You can only update your own profile"
        );
      }

      const user = await userService.updateUserById(userId, req.body);
      res.send(user as UserResponse);
    }
  }
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response<UserDeleteResponse>) => {
    if (typeof req.params["userId"] === "string") {
      const currentUser = req.user as IUser;
      const isAllowed = permissionService.checkPermissions(
        currentUser.role,
        "delete",
        "users"
      );
      if (!isAllowed) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to delete users"
        );
      }

      await userService.deleteUserById(req.params["userId"]);
      res.status(httpStatus.NO_CONTENT).send();
    }
  }
);

export const createGuestUser = catchAsync(
  async (req: Request, res: Response) => {
    const user = await userService.createGuestUser(req.body.name);
    res.status(httpStatus.CREATED).send(user);
  }
);

export const convertGuestToRegular = catchAsync(
  async (req: Request, res: Response) => {
    const user = await userService.updateGuestToRegular(
      req.params.userId,
      req.body.email,
      req.body.password
    );
    res.status(httpStatus.OK).send(user);
  }
);
