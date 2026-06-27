import type { AdminBootstrapConfig } from "../bootstrap";
import type {
  DatasetCommunesResponse,
  DatasetMode,
  DatasetSummaryResponse,
  DatasetWilayasResponse,
  WilayaDatasetRecord,
} from "../types/dataset";

export async function fetchDatasetWilayas(
  config: AdminBootstrapConfig,
  mode: DatasetMode = "current",
): Promise<DatasetWilayasResponse> {
  const payload = await fetchDataset<DatasetWilayasResponse>(config, {
    mode,
    include: "wilayas",
  });

  if (payload.mode !== "current" || !Array.isArray(payload.wilayas)) {
    throw new Error("Dataset wilaya response did not match the expected contract.");
  }

  payload.wilayas.forEach(assertWilayaRecord);
  return payload;
}

export async function fetchDatasetSummary(
  config: AdminBootstrapConfig,
  mode: DatasetMode = "current",
): Promise<DatasetSummaryResponse> {
  return fetchDataset<DatasetSummaryResponse>(config, { mode, include: "summary" });
}

export async function fetchDatasetCommunes(
  config: AdminBootstrapConfig,
  wilayaCode?: string,
): Promise<DatasetCommunesResponse> {
  const payload = await fetchDataset<DatasetCommunesResponse>(config, {
    mode: "current",
    include: "communes",
    wilaya_code: wilayaCode,
  });

  if (!Array.isArray(payload.communes)) {
    throw new Error("Dataset commune response did not match the expected contract.");
  }

  return payload;
}

async function fetchDataset<TPayload>(
  config: AdminBootstrapConfig,
  params: Record<string, string | undefined>,
): Promise<TPayload> {
  const endpoint = new URL("dataset", ensureTrailingSlash(config.restUrl));
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      endpoint.searchParams.set(key, value);
    }
  });

  const response = await fetch(endpoint, {
    method: "GET",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-WP-Nonce": config.nonce,
    },
  });

  if (!response.ok) {
    throw new Error(`Dataset request failed with HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isObject(payload)) {
    throw new Error("Dataset response was not a JSON object.");
  }

  return payload as TPayload;
}

function assertWilayaRecord(wilaya: WilayaDatasetRecord): void {
  if (
    !wilaya ||
    typeof wilaya.code !== "string" ||
    typeof wilaya.name_fr !== "string" ||
    typeof wilaya.name_ar !== "string" ||
    typeof wilaya.label !== "string"
  ) {
    throw new Error("Dataset wilaya record did not match the expected contract.");
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
