import type { PreviewRequest, PreviewResponse } from "@/types/preview";

export type WilayaStatus = "ready" | "missing" | "managed" | "manual" | "conflict" | "needs_update";

export type Method = {
  id: string;
  label: string;
  price: number | null | undefined;
  enabled: boolean;
};

export type Wilaya = {
  code: string;
  name: string;
  ar: string;
  enabled: boolean;
  status: WilayaStatus;
  methods: Record<string, Method>;
};

export type MethodDef = {
  key: string;
  label: string;
  defaultPrice: number | null;
  locked: boolean;
};

export type WilayaReference = {
  code: string;
  name: string;
  ar: string;
};

export type GeneratorPreviewContext = {
  selectedWilayaCount: number;
  communeCoverageSummary: string;
  enabledMethodLabels: string[];
  priceSummary: string;
  regionFormatLabel: string;
};

export type GeneratorPreviewSnapshot = {
  response: PreviewResponse;
  context: GeneratorPreviewContext;
  request: PreviewRequest;
};
