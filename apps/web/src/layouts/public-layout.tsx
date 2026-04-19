import { Outlet, useLocation } from "react-router-dom";

import { AuthButton } from "@/components/auth-button";

export function PublicLayout() {
  const { pathname } = useLocation();
  const onAuthRoute = pathname === "/sign-in" || pathname.startsWith("/auth/");

  return (
    <>
      <Outlet />
      {!onAuthRoute && <AuthButton />}
    </>
  );
}
