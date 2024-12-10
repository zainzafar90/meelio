import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@repo/shared";

export function PublicLayout() {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/soundscapes" replace />;
  }

  return <Outlet />;
}
