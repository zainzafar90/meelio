import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "../../popup";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
