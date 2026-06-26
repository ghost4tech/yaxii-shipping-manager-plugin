/* eslint-disable react-refresh/only-export-components */
import { RouterProvider, createHashHistory } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { getRouter } from "./router";
import "./styles.css";
import {
  fetchBootstrap,
  localizedBootstrap,
  type YaxiiShippingManagerBootstrap,
} from "./wp-admin-bootstrap";

type BootstrapState = {
  status: "loading" | "ready" | "error";
  config?: YaxiiShippingManagerBootstrap;
  message?: string;
};

function WordPressBootstrapStatus() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>(() => {
    const config = localizedBootstrap();

    return {
      status: config ? "loading" : "error",
      config,
      message: config ? undefined : "Missing WordPress bootstrap config.",
    };
  });

  useEffect(() => {
    let mounted = true;

    fetchBootstrap()
      .then((config) => {
        if (mounted) {
          setBootstrapState({ status: "ready", config });
        }
      })
      .catch((error: Error) => {
        if (mounted) {
          setBootstrapState((currentState) => ({
            status: "error",
            config: currentState.config,
            message: error.message,
          }));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const config = bootstrapState.config;
  const wooLabel = config?.woocommerceActive ? "WooCommerce active" : "WooCommerce inactive";
  const restLabel =
    bootstrapState.status === "ready"
      ? "REST bootstrap connected"
      : bootstrapState.status === "loading"
        ? "Checking REST bootstrap"
        : (bootstrapState.message ?? "REST bootstrap unavailable");

  return (
    <div className="border-b bg-white px-4 py-3 text-sm text-foreground shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <span className="font-semibold">Yaxii Shipping Manager</span>
        <span className="rounded-md border px-2 py-1 text-xs">{wooLabel}</span>
        <span className="rounded-md border px-2 py-1 text-xs">{restLabel}</span>
        <span className="text-xs text-muted-foreground">
          Version {config?.pluginVersion ?? "unknown"} - WordPress admin mount
        </span>
      </div>
    </div>
  );
}

function WordPressAdminApp() {
  const router = getRouter({ history: createHashHistory() });

  return (
    <>
      <WordPressBootstrapStatus />
      <RouterProvider router={router} />
    </>
  );
}

const mountNode = document.getElementById("yaxii-shipping-manager-admin-app");

if (mountNode) {
  createRoot(mountNode).render(<WordPressAdminApp />);
}
