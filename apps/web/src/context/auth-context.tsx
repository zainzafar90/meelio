import React from "react";

import { AuthState } from "@/store/auth.store";

export const AuthContext = React.createContext<AuthState>({
  loading: false,
  user: null,
  authenticate: () => console.warn("NOOP"),
  logout: () => console.warn("NOOP"),
});
