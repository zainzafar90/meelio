import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import { ErrorPage } from "@/routes/errors/error";

import { PageSkeleton } from "@repo/shared";
import { PublicLayout } from "@/layouts/public-layout";

const Home = React.lazy(() => import("@/routes/home/home"));

export const Router = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <Home />
            </React.Suspense>
          }
          errorElement={<ErrorPage />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
