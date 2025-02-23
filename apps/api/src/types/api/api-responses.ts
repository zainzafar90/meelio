import { IAccessAndRefreshTokens, IUser } from "../interfaces/resources";
import {
  DeleteResponse,
  ResourceListResponse,
  ResourceResponse,
} from "./api-operations";

// Auth
export type AuthResponse = ResourceResponse<IAccessAndRefreshTokens>;
export type UserAuthResponse = ResourceResponse<
  { tokens: IAccessAndRefreshTokens } & { user: IUser }
>;

// Profile
export type UserProfileResponse = ResourceResponse<IUser>;

// Users
export type UserResponse = ResourceResponse<IUser>;
export type UserListResponse = ResourceListResponse<IUser>;
export type UserDeleteResponse = DeleteResponse;
