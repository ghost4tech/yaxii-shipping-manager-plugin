import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type DatasetMode = "current" | "legacy";

export type SetupPath = "quick" | "manual" | "csv";

export type MethodId = "home" | "office";

export type ZoneStatus = "draft" | "missing" | "manual" | "conflict" | "managed";

export type DeliveryMethod = {
  id: MethodId;
  label: string;
  enabled: boolean;
  price: number;
};

export type WilayaDraft = {
  code: string;
  nameFr: string;
  nameAr: string;
  enabled: boolean;
  status: ZoneStatus;
  methods: Record<MethodId, DeliveryMethod>;
};

export type ScreenId =
  | "setup"
  | "zones"
  | "diagnostics"
  | "import-export"
  | "settings"
  | "sync";
