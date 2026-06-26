export type YaxiiShippingManagerBootstrap = {
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
  datasetStatus: {
    currentDatasetAvailable: boolean;
    legacyDatasetAvailable: boolean;
    communesAvailable: boolean;
  };
};

declare global {
  interface Window {
    yaxiiShippingManagerAdmin?: YaxiiShippingManagerBootstrap;
  }
}

export function localizedBootstrap(): YaxiiShippingManagerBootstrap | undefined {
  return window.yaxiiShippingManagerAdmin;
}

export async function fetchBootstrap(): Promise<YaxiiShippingManagerBootstrap> {
  const bootstrap = localizedBootstrap();

  if (!bootstrap) {
    throw new Error("Missing Yaxii Shipping Manager bootstrap config.");
  }

  const response = await fetch(`${bootstrap.restUrl}bootstrap`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-WP-Nonce": bootstrap.nonce,
    },
  });

  if (!response.ok) {
    throw new Error(`Bootstrap request failed with ${response.status}.`);
  }

  return response.json() as Promise<YaxiiShippingManagerBootstrap>;
}
