import { Outlet } from "react-router-dom";

import { SignInButton } from "@/components/sign-in-button";

export function PublicLayout() {
  return (
    <>
      <Outlet />
      <SignInButton />
    </>
  );
}
