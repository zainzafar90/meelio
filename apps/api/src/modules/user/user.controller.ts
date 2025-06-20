import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "@/utils/catch-async";
import { pick } from "@/utils/pick";
import { ApiError } from "@/common/errors/api-error";

import { permissionService } from "../permissions/permission.service";
import { userService } from "./user.service";
import {
  UserDeleteResponse,
  UserListResponse,
  UserProfileResponse,
  UserResponse,
} from "@/types/api/api-responses";
import { IUser } from "@/types/interfaces/resources";
import { IOptions } from "@/types/interfaces/pagination";

export const userController = {
  createUser: catchAsync(async (req: Request, res: Response<UserResponse>) => {
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
  }),

  getUser: catchAsync(async (req: Request, res: Response<UserResponse>) => {
    const user = req.user as IUser;
    const isAllowed = permissionService.checkPermissions(
      user.role,
      "read",
      "users"
    );
    if (!isAllowed) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to view users"
      );
    }

    const targetUser = await userService.getUserById(req.params.userId);
    if (!targetUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    res.send(targetUser);
  }),

  getMe: catchAsync(
    async (req: Request, res: Response<UserProfileResponse>) => {
      const user = req.user as IUser;
      const result = await userService.getMe(user.id);
      res.send(result);
    }
  ),

  updateUser: catchAsync(async (req: Request, res: Response<UserResponse>) => {
    const user = req.user as IUser;
    const isAllowed = permissionService.checkPermissions(
      user.role,
      "update",
      "users"
    );
    if (!isAllowed) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to update users"
      );
    }

    const updatedUser = await userService.updateUserById(
      req.params.userId,
      req.body
    );
    res.send(updatedUser);
  }),

  updateMe: catchAsync(
    async (req: Request, res: Response<UserProfileResponse>) => {
      const user = req.user as IUser;
      const updatedUser = await userService.updateUserById(user.id, req.body);
      res.send(updatedUser);
    }
  ),

  deleteUser: catchAsync(
    async (req: Request, res: Response<UserDeleteResponse>) => {
      const user = req.user as IUser;
      const isAllowed = permissionService.checkPermissions(
        user.role,
        "delete",
        "users"
      );
      if (!isAllowed) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to delete users"
        );
      }

      await userService.deleteUserById(req.params.userId);
      res.status(httpStatus.NO_CONTENT).send();
    }
  ),

  deleteMe: catchAsync(
    async (req: Request, res: Response<UserDeleteResponse>) => {
      const user = req.user as IUser;
      await userService.deleteUserById(user.id);
      res.status(httpStatus.NO_CONTENT).send();
    }
  ),

  // createGuestUser: catchAsync(async (req: Request, res: Response) => {
  //   const user = await userService.createGuestUser(req.body.name);
  //   res.status(httpStatus.CREATED).send(user);
  // }),

  convertGuestToRegular: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateGuestToRegular(req.params.userId, {
      email: req.body.email,
      password: req.body.password,
    });
    res.status(httpStatus.OK).send(user);
  }),
};
