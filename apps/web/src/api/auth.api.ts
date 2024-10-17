import { AuthUser } from "@/types/auth";
import { axios } from "@/api/axios";

export function loginAccount({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return axios.post("/v1/account/login", {
    email,
    password,
  });
}

export function sendMagicLink({ email }: { email: string }) {
  return axios.post(
    "/v1/account/send-magic-link",
    {},
    {
      params: {
        email,
      },
    }
  );
}

export function verifyMagicLink({ token }: { token: string }) {
  return axios.post(
    "/v1/account/verify-magic-link",
    {},
    {
      params: {
        token,
      },
    }
  );
}

export function getAuthenticatedAccount(): Promise<AuthUser | null> {
  return axios.get("/v1/account");
}

export function updateAccount({
  name,
}: {
  name: string;
}): Promise<AuthUser | null> {
  return axios.put("/v1/account", {
    name,
  });
}

export function logoutAccount() {
  return axios.post("/v1/account/logout");
}
