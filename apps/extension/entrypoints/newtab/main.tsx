import React from "react";
import { createRoot } from "react-dom/client";
import NewTab from "../../src/newtab";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <NewTab />
  </React.StrictMode>
);
