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
    manageOptions: boolean;
  };
  woocommerceActive: boolean;
  adminUrls: {
    pluginPage: string;
    shippingZones: string;
  };
  featureFlags: {
    datasetReady: boolean;
    diagnosticsReady: boolean;
    previewPlannerReady: boolean;
    applyEngineReady: boolean;
    csvReady: boolean;
    smartFormSyncReady: boolean;
  };
  dataset: {
    currentVerified: boolean;
    legacySupported: boolean;
    version: string | null;
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

  return response.json() as Promise<BootstrapPayload>;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
