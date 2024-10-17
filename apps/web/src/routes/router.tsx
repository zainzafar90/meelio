import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { NotFoundPage } from "@/routes/errors/404";
import { ErrorPage } from "@/routes/errors/error";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { ProtectedLayout } from "@/layouts/protected-layout";
import { PublicLayout } from "@/layouts/public-layout";

const Register = React.lazy(() => import("@/routes/auth/register"));
const Login = React.lazy(() => import("@/routes/auth/login"));
const Soundscapes = React.lazy(() => import("@/routes/soundscapes"));
const Pomodoro = React.lazy(() => import("@/routes/pomodoro"));
const Billing = React.lazy(() => import("@/routes/account/billing"));
const Settings = React.lazy(() => import("@/routes/account/settings"));
const VerifyMagicLink = React.lazy(
  () => import("@/routes/auth/verify-magic-link")
);

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

      <Route path="/" element={<ProtectedLayout />}>
        <Route
          path="soundscapes"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Soundscapes />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
        <Route
          path="pomodoro"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Pomodoro />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
        <Route path="account">
          <Route
            path="billing"
            element={
              <React.Suspense fallback={<PageSkeleton />}>
                <Billing />
              </React.Suspense>
            }
            errorElement={<ErrorPage />}
          />
          <Route
            path="settings"
            element={
              <React.Suspense fallback={<PageSkeleton />}>
                <Settings />
              </React.Suspense>
            }
            errorElement={<ErrorPage />}
          />
        </Route>

        <Route path="" element={<Navigate to="/soundscapes" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
