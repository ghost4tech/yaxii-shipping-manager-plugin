import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  fetchBootstrapPayload,
  readBootstrapConfig,
  type AdminBootstrapConfig,
  type BootstrapPayload,
} from "./bootstrap";
import AdminApp from "./routes";
import "./styles.css";

type BootState =
  | { status: "loading" }
  | { status: "ready"; config: AdminBootstrapConfig; payload: BootstrapPayload }
  | { status: "error"; message: string };

const mount = document.getElementById("yaxii-shipping-manager-admin-app");

if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <WordPressAdminApp />
    </StrictMode>,
  );
}

function WordPressAdminApp() {
  const [state, setState] = useState<BootState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const config = readBootstrapConfig();
        const payload = await fetchBootstrapPayload(config);
        if (!cancelled) {
          setState({ status: "ready", config, payload });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to load the admin bootstrap data.",
          });
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <ShellMessage
        title="Loading Yaxii Shipping Manager"
        message="Fetching WordPress admin bootstrap data..."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ShellMessage
        title="Unable to load Yaxii Shipping Manager"
        message={state.message}
        tone="error"
      />
    );
  }

  return <AdminApp bootstrap={state.payload} config={state.config} />;
}

function ShellMessage({
  title,
  message,
  tone = "default",
}: {
  title: string;
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <div className="yaxii-shipping-manager-app min-h-[360px] bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <div
          className={
            tone === "error"
              ? "text-base font-semibold text-destructive"
              : "text-base font-semibold"
          }
        >
          {title}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
