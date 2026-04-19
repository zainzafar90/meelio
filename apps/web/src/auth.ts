import { createAuth } from "@/lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error("VITE_API_URL is required (see apps/web/.env.example)");
}

export const authClient = createAuth(API_URL);
export const apiUrl = API_URL;
