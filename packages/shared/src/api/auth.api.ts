import { AxiosResponse } from "axios";

import { AuthUser } from "../types/auth";
import { axios } from "./axios";

export function loginAccount({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AxiosResponse<AuthUser>> {
  return axios.post("/v1/account/login", { email, password });
}

export function sendMagicLink({
  email,
}: {
  email: string;
}): Promise<AxiosResponse> {
  return axios.post("/v1/account/send-magic-link", {}, { params: { email } });
}

export function verifyMagicLink({
  token,
}: {
  token: string;
}): Promise<AxiosResponse<AuthUser>> {
  return axios.post("/v1/account/verify-magic-link", {}, { params: { token } });
}

export function getAuthenticatedAccount(): Promise<AxiosResponse<AuthUser>> {
  return axios.get("/v1/account");
}

export function updateAccount({
  name,
}: {
  name: string;
}): Promise<AuthUser | null> {
  return axios.put("/v1/account", { name });
}

export function logoutAccount(): Promise<AxiosResponse> {
  return axios.post("/v1/account/logout");
}
