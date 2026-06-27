import type { AdminBootstrapConfig } from "../bootstrap";
import type { ShippingMethodTemplate } from "../types/generator";
import type { PersistedSettings, SettingsResponse } from "../types/settings";

export async function fetchSettings(config: AdminBootstrapConfig): Promise<SettingsResponse> {
  return requestSettings(config, "GET");
}

export async function saveSettings(
  config: AdminBootstrapConfig,
  settings: PersistedSettings,
): Promise<SettingsResponse> {
  return requestSettings(config, "PUT", settings);
}

async function requestSettings(
  config: AdminBootstrapConfig,
  method: "GET" | "PUT",
  settings?: PersistedSettings,
): Promise<SettingsResponse> {
  const response = await fetch(new URL("settings", ensureTrailingSlash(config.restUrl)), {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-WP-Nonce": config.nonce,
    },
    body: settings ? JSON.stringify(settings) : undefined,
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      errorMessageFromPayload(payload, `Settings request failed with HTTP ${response.status}.`),
    );
  }

  return parseSettingsResponse(payload);
}

function parseSettingsResponse(payload: unknown): SettingsResponse {
  if (
    !isObject(payload) ||
    !isPersistedSettings(payload.settings) ||
    !isPersistedSettings(payload.defaults)
  ) {
    throw new Error("Settings response did not match the expected contract.");
  }

  return {
    settings: payload.settings,
    defaults: payload.defaults,
    options: isObject(payload.options)
      ? (payload.options as SettingsResponse["options"])
      : {
          optionName: "yaxii_shipping_manager_settings",
          datasetModes: ["current", "legacy_58"],
          availableModes: ["current"],
          regionLabelFormats: ["fr", "ar", "fr_ar", "ar_fr"],
          zoneNameFormats: ["prefix_code_name", "code_name", "name_only", "prefix_name"],
          officeWordingModes: ["office_delivery", "stopdesk", "bureau", "custom"],
          methodKeys: ["home_delivery", "office_delivery", "custom_1", "custom_2"],
          methodType: "flat_rate",
          currency: { editable: false, fallback: "DZD" },
        },
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
  };
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (!isObject(value) || !Array.isArray(value.methods) || !isObject(value.safetyPolicy)) {
    return false;
  }

  return (
    typeof value.datasetMode === "string" &&
    typeof value.regionLabelFormat === "string" &&
    typeof value.zoneNameFormat === "string" &&
    typeof value.zonePrefix === "string" &&
    typeof value.officeWordingMode === "string" &&
    typeof value.officeCustomLabel === "string" &&
    value.methods.every(isShippingMethodTemplate)
  );
}

function isShippingMethodTemplate(method: unknown): method is ShippingMethodTemplate {
  return (
    isObject(method) &&
    typeof method.key === "string" &&
    typeof method.enabled === "boolean" &&
    typeof method.label === "string" &&
    (typeof method.defaultPrice === "number" || method.defaultPrice === null) &&
    method.type === "flat_rate" &&
    typeof method.locked === "boolean"
  );
}

function errorMessageFromPayload(payload: unknown, fallback: string): string {
  if (isObject(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
