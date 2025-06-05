export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthError";
  }
}

/**
 * Create Google consent URL for calendar access.
 */
export const buildConsentUrl = (cfg: OAuthConfig, state: string): string => {
  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${base}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens.
 */
export const exchangeCodeForTokens = async (
  cfg: OAuthConfig,
  code: string,
  fetcher: typeof fetch,
  now: () => number,
): Promise<OAuthTokens> => {
  const res = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new OAuthError("failed to exchange code");
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: now() + json.expires_in * 1000,
  };
};

/**
 * Refresh access token using refresh token.
 */
export const refreshAccessToken = async (
  cfg: OAuthConfig,
  refreshToken: string,
  fetcher: typeof fetch,
  now: () => number,
): Promise<Omit<OAuthTokens, "refreshToken">> => {
  const res = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new OAuthError("failed to refresh token");
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    expiresAt: now() + json.expires_in * 1000,
  };
};
