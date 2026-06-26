import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";

const mountNode = document.getElementById("yaxii-shipping-manager-admin-app");

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
