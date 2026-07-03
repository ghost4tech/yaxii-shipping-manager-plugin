export type DatasetMode = "current" | "legacy_58";

export type DatasetStatusEntry = {
  available: boolean;
  complete: boolean;
  verified: boolean;
  wilayaCount?: number;
  communeCount?: number;
  version?: string;
  reason?: string;
};

export type CurrentDatasetStatus = DatasetStatusEntry & {
  wilayaCount: number;
  communeCount: number;
  version: string;
};

export type DatasetStatus = {
  current: CurrentDatasetStatus;
  legacy58: DatasetStatusEntry;
};

export type DatasetMetadata = {
  mode: DatasetMode;
  source?: string;
  source_commit?: string;
  version?: string;
  complete: boolean;
  verified: boolean;
  wilaya_count?: number;
  commune_count?: number;
  license?: string;
  warnings?: string[];
  available?: boolean;
  reason?: string;
};

export type WilayaDatasetRecord = {
  code: string;
  source_id: number;
  name_fr: string;
  name_ar: string;
  label: string;
  mode: DatasetMode;
  supported: boolean;
  notes: string[];
};

export type CommuneDatasetRecord = {
  code: string;
  source_id: number;
  wilaya_code: string;
  name_fr: string;
  name_ar: string;
  mode: DatasetMode;
  supported: boolean;
  notes: string[];
};

export type DatasetSummaryResponse = {
  mode: DatasetMode;
  include: "summary";
  metadata: DatasetMetadata;
  status: DatasetStatus;
};

export type DatasetWilayasResponse = {
  mode: DatasetMode;
  include: "wilayas";
  metadata: DatasetMetadata;
  wilayas: WilayaDatasetRecord[];
};

export type DatasetCommunesResponse = {
  mode: DatasetMode;
  include: "communes";
  metadata: DatasetMetadata;
  communes: CommuneDatasetRecord[];
};
