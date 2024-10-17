import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

import { api } from "@/api";

import { AuthUser } from "@/types/auth";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { useAuthStore } from "@/store/auth.store";

export function ProtectedLayout() {
  const navigate = useNavigate();
  const { user, loading, authenticate } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        const response = await api.auth.getAuthenticatedAccount();
        const user = response as AuthUser;
        authenticate(user);
      } catch (error) {
        console.error(error);
        navigate("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}
