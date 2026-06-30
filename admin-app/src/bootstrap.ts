import type { DatasetStatus } from "./types/dataset";
import type { DatasetMode } from "./types/dataset";

export type AdminBootstrapConfig = {
  restUrl: string;
  nonce: string;
};

export type BootstrapPayload = {
  pluginVersion: string;
  restNamespace: string;
  restUrl: string;
  nonce: string;
  capabilities: {
    manageWooCommerce: boolean;
    manageOptions: boolean;
    accessPlugin: boolean;
  };
  woocommerceActive: boolean;
  adminUrls: {
    pluginPage: string;
    woocommerceSettings: string;
    plugins: string;
  };
  featureFlags: {
    diagnostics: boolean;
    previewPlanner: boolean;
    applyEngine: boolean;
    csvImportExport: boolean;
    ysfSync: boolean;
  };
  datasetStatus: DatasetStatus;
  wooStatesStatus: {
    woocommerceActive: boolean;
    active: boolean;
    datasetMode: DatasetMode;
    wilayaCount: number;
    legacyAvailable: boolean;
  };
};

declare global {
  interface Window {
    yaxiiShippingManagerAdmin?: AdminBootstrapConfig;
  }
}

export function readBootstrapConfig(): AdminBootstrapConfig {
  const config = window.yaxiiShippingManagerAdmin;

  if (!config?.restUrl || !config?.nonce) {
    throw new Error(
      "Missing WordPress bootstrap config. Refresh the page or check the admin asset enqueue.",
    );
  }

  return config;
}

export async function fetchBootstrapPayload(
  config: AdminBootstrapConfig,
): Promise<BootstrapPayload> {
  const endpoint = new URL("bootstrap", ensureTrailingSlash(config.restUrl));
  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-WP-Nonce": config.nonce,
    },
  });

  if (!response.ok) {
    throw new Error(`Bootstrap request failed with HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  return parseBootstrapPayload(payload);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function parseBootstrapPayload(payload: unknown): BootstrapPayload {
  if (!isObject(payload)) {
    throw new Error("Bootstrap response was not a JSON object.");
  }
  if (
    typeof payload.pluginVersion !== "string" ||
    typeof payload.restNamespace !== "string" ||
    typeof payload.restUrl !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.woocommerceActive !== "boolean" ||
    !isObject(payload.capabilities) ||
    !isObject(payload.adminUrls) ||
    !isObject(payload.featureFlags) ||
    !isObject(payload.datasetStatus) ||
    !isObject(payload.wooStatesStatus)
  ) {
    throw new Error("Bootstrap response did not match the expected contract.");
  }

  return payload as BootstrapPayload;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
