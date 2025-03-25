import { Route, Routes, Navigate } from "react-router-dom";

import { ErrorPage } from "@/routes/errors/error";

import { PublicLayout } from "@/layouts/public-layout";

import Home from "@/routes/home/home";

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
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
