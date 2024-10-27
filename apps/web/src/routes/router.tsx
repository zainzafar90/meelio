import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Settings } from "lucide-react";

import { NotFoundPage } from "@/routes/errors/404";
import { ErrorPage } from "@/routes/errors/error";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { ProtectedLayout } from "@/layouts/protected-layout";
import { PublicLayout } from "@/layouts/public-layout";

import { Billing } from "./account/billing";
import { Login } from "./auth/login";
import { Register } from "./auth/register";
import { VerifyMagicLink } from "./auth/verify-magic-link";
import { Home } from "./home";
import { Pomodoro } from "./pomodoro";
import { WorldClock } from "./world-clock";

const Breathing = React.lazy(() => import("@/routes/breathing"));
const Soundscapes = React.lazy(() => import("@/routes/soundscapes"));

export const Router = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <React.Suspense fallback={<PageSkeleton />}>
            <Home />
          </React.Suspense>
        }
        errorElement={<ErrorPage />}
      />

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

      <Route element={<ProtectedLayout />}>
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
        <Route
          path="breathing"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Breathing />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />

        <Route
          path="world-clock"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <WorldClock />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
