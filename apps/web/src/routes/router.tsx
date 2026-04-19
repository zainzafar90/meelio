import { Route, Routes, Navigate } from "react-router-dom";

import { ErrorPage } from "@/routes/errors/error";

import { PublicLayout } from "@/layouts/public-layout";

import Home from "@/routes/home/home";
import SignIn from "@/routes/sign-in/sign-in";
import AuthExtension from "@/routes/auth-extension/auth-extension";

export const Router = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
              <Home />
          }
          errorElement={<ErrorPage />}
        />
        <Route path="/sign-in" element={<SignIn />} errorElement={<ErrorPage />} />
        <Route
          path="/auth/extension"
          element={<AuthExtension />}
          errorElement={<ErrorPage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
