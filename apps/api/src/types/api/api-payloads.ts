import { IUser } from "../interfaces/resources";

// Auth
export type EmailPassReq = { email: string; password: string };

// Users
export type CreateUserReq = Omit<IUser, "id" | "isEmailVerified">;
export type UpdateUserReq = Partial<IUser>;
export type RegisterUserReq = Omit<IUser, "id" | "role" | "isEmailVerified">;
