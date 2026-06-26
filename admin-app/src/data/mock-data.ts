import type { DatasetMode, MethodId, SetupPath, WilayaDraft } from "../types";

export const setupPaths: Array<{
  id: SetupPath;
  title: string;
  description: string;
}> = [
  {
    id: "quick",
    title: "Quick Setup",
    description: "Start from the current Algeria dataset and default home/office prices.",
  },
  {
    id: "manual",
    title: "Manual Setup",
    description: "Choose dataset mode, wilayas, methods, and draft pricing yourself.",
  },
  {
    id: "csv",
    title: "CSV Import",
    description: "Prepare a local CSV for validation once the backend parser is available.",
  },
];

export const datasetModes: Array<{
  id: DatasetMode;
  title: string;
  description: string;
}> = [
  {
    id: "current",
    title: "Current Algeria dataset",
    description: "Default mode for new stores after the verified local dataset lands.",
  },
  {
    id: "legacy",
    title: "Legacy 58-compatible dataset",
    description: "Compatibility mode for older stores or provider tables that expect legacy rows.",
  },
];

export const methodLabels: Record<MethodId, string> = {
  home: "Home delivery",
  office: "Office / Stopdesk",
};

export const initialWilayaDrafts: WilayaDraft[] = [
  createWilaya("16", "Alger", "الجزائر", true, "managed", 500, 300),
  createWilaya("31", "Oran", "وهران", true, "draft", 800, 500),
  createWilaya("25", "Constantine", "قسنطينة", true, "conflict", 700, 450),
  createWilaya("09", "Blida", "البليدة", true, "managed", 550, 350),
  createWilaya("06", "Bejaia", "بجاية", false, "missing", 900, 600),
  createWilaya("05", "Batna", "باتنة", true, "manual", 850, 550),
  createWilaya("19", "Setif", "سطيف", true, "draft", 800, 500),
  createWilaya("23", "Annaba", "عنابة", true, "managed", 950, 650),
];

function createWilaya(
  code: string,
  nameFr: string,
  nameAr: string,
  enabled: boolean,
  status: WilayaDraft["status"],
  homePrice: number,
  officePrice: number,
): WilayaDraft {
  return {
    code,
    nameFr,
    nameAr,
    enabled,
    status,
    methods: {
      home: {
        id: "home",
        label: methodLabels.home,
        enabled: true,
        price: homePrice,
      },
      office: {
        id: "office",
        label: methodLabels.office,
        enabled: true,
        price: officePrice,
      },
    },
  };
}
