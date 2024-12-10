import React from "react";
import { Route, Routes } from "react-router-dom";

import { ErrorPage } from "@/routes/errors/error";

import { PageSkeleton } from "@repo/shared";
import { PublicLayout } from "@/layouts/public-layout";

const Home = React.lazy(() => import("@/routes/home/home"));
const Login = React.lazy(() => import("@/routes/auth/login"));
const Register = React.lazy(() => import("@/routes/auth/register"));
const VerifyMagicLink = React.lazy(() => import("@/routes/auth/verify-magic-link"));

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
