import React from "react";
import { Route, Routes } from "react-router-dom";

import { ErrorPage } from "@/routes/errors/error";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { PublicLayout } from "@/layouts/public-layout";

import { Login } from "./auth/login";
import { Register } from "./auth/register";
import { VerifyMagicLink } from "./auth/verify-magic-link";
import { Home } from "./home";

export const Router = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/register"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Register />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
        <Route
          path="/login"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Login />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />

        <Route
          path="/verify-magic-link"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <VerifyMagicLink />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
      </Route>

      {/* Make home route public */}
      <Route
        path="/"
        element={
          <React.Suspense fallback={<PageSkeleton />}>
            <Home />
          </React.Suspense>
        }
        errorElement={<ErrorPage />}
      />

      <Route path="*" element={<Home />} />
    </Routes>
  );
};
