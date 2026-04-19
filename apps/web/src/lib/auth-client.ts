import { createWebAuthClient } from "@repo/api-client/auth";

export const createAuth = (baseURL: string) => createWebAuthClient({ baseURL });

export type Auth = ReturnType<typeof createAuth>;
