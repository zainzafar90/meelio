import { AuthState } from "../stores";
import React from "react";

export const AuthContext = React.createContext<AuthState>({
  loading: false,
  user: null,
  guestUser: null,
  authenticate: () => console.warn("NOOP"),
  authenticateGuest: () => console.warn("NOOP"),
  logout: () => console.warn("NOOP"),
});
