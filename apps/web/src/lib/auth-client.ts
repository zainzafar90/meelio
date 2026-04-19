import { createWebAuthClient } from "@repo/api-client/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const authClient = createWebAuthClient({ baseURL: API_URL });
