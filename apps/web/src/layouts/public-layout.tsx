import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/auth.store";

export function PublicLayout() {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/soundscapes" replace />;
  }

  return <Outlet />;
}
