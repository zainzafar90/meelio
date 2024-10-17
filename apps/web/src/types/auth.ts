export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  image?: string;
  provider?: string;
  providerId?: string;
  isPro: boolean;
  subscriptionId?: string;
};
