import type { ZoneNameFormat } from "../types/settings";

export type ZoneNamePreviewInput = {
  format: ZoneNameFormat;
  prefix: string;
  code: string;
  name: string;
};

export function zoneNamePreview(input: ZoneNamePreviewInput): string {
  const prefix = input.prefix.trim() || "Yaxii";

  if (input.format === "code_name") {
    return `${input.code} - ${input.name}`;
  }

  if (input.format === "name_only") {
    return input.name;
  }

  if (input.format === "prefix_name") {
    return `${prefix} - ${input.name}`;
  }

  return `${prefix} - ${input.code} ${input.name}`;
}
