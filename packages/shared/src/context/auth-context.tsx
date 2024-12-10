import { AuthState } from "@repo/shared";
import React from "react";

export const AuthContext = React.createContext<AuthState>({
  loading: false,
  user: null,
  authenticate: () => console.warn("NOOP"),
  logout: () => console.warn("NOOP"),
});
