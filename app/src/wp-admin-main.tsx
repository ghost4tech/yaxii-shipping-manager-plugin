import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WordPressAdminApp } from "./wp-admin-app";
import "./wp-admin-styles.css";

const mountNode = document.getElementById("yaxii-shipping-manager-admin-app");

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <WordPressAdminApp />
    </StrictMode>,
  );
}
