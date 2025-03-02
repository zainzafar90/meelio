export type AuthRole = "user" | "guest";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: AuthRole;
  image?: string;
  provider?: string;
  providerId?: string;
  isPro: boolean;
  subscriptionId?: string;
};

export interface GuestUser {
  id: string;
  name: string;
  role: AuthRole;
  createdAt: string;
}
