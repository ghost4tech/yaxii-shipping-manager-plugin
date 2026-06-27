import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Edit3,
  FileSpreadsheet,
  FileUp,
  Lock,
  Package,
  Percent,
  Power,
  PowerOff,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";

import type { AdminBootstrapConfig, BootstrapPayload } from "../bootstrap";
import { fetchDatasetWilayas } from "../api/dataset-api";
import {
  DATASET_MODE_OPTIONS,
  DEFAULT_GENERATOR_DRAFT,
  DEFAULT_SETTINGS_DRAFT,
  DEFAULT_SHIPPING_METHOD_TEMPLATES,
  OFFICE_METHOD_WORDING_OPTIONS,
  REGION_LABEL_FORMAT_OPTIONS,
  SAFETY_RULES,
  SETUP_PATH_OPTIONS,
  ZONE_NAMING_OPTIONS,
  officeLabelForWording,
} from "../data/default-settings";
import { formatRegionLabel } from "../domain/format-region-label";
import { zoneNamePreview } from "../domain/zone-name-preview";
import type { DatasetMode, WilayaDatasetRecord } from "../types/dataset";
import type { ShippingMethodKey, ShippingMethodTemplate } from "../types/generator";
import type {
  OfficeMethodWording,
  RegionLabelFormat,
  SetupPath,
  ZoneNameFormat,
} from "../types/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type WilayaStatus = "ready" | "missing" | "managed" | "manual" | "conflict" | "needs_update";

type Method = {
  id: string;
  label: string;
  price: number | null | undefined;
  enabled: boolean;
};

type Wilaya = {
  code: string;
  name: string;
  ar: string;
  enabled: boolean;
  status: WilayaStatus;
  methods: Record<string, Method>;
};

type MethodDef = Pick<ShippingMethodTemplate, "key" | "label" | "defaultPrice" | "locked">;

const DEFAULT_METHOD_DEFS: MethodDef[] = enabledMethodDefs(DEFAULT_SHIPPING_METHOD_TEMPLATES);

const TABS = [
  { id: "zones", label: "Shipping Zones", icon: Package },
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "import", label: "Import / Export", icon: Upload },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "sync", label: "Smart Form Sync", icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];
type WilayaReference = { code: string; name: string; ar: string };
type DatasetLoadState =
  | { status: "loading" }
  | { status: "ready"; metadataVersion: string; records: WilayaDatasetRecord[] }
  | { status: "error"; message: string };

export default function AdminApp({
  bootstrap,
  config,
}: {
  bootstrap: BootstrapPayload;
  config: AdminBootstrapConfig;
}) {
  const [tab, setTabState] = useState<TabId>(getInitialTab);
  const [datasetState, setDatasetState] = useState<DatasetLoadState>({ status: "loading" });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [methodDefs, setMethodDefs] = useState<MethodDef[]>(DEFAULT_METHOD_DEFS);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDataset() {
      try {
        const response = await fetchDatasetWilayas(config, "current");
        if (!cancelled) {
          setDatasetState({
            status: "ready",
            metadataVersion: response.metadata.version ?? "current-candidate-2025",
            records: response.wilayas,
          });
          setWilayas(datasetRecordsToWilayas(response.wilayas, DEFAULT_METHOD_DEFS));
        }
      } catch (error) {
        if (!cancelled) {
          setDatasetState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to load the normalized dataset.",
          });
        }
      }
    }

    loadDataset();

    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    const onHashChange = () => setTabState(getInitialTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setTab = (next: TabId) => {
    setTabState(next);
    window.location.hash = `/${next}`;
  };

  const datasetReady = datasetState.status === "ready";

  return (
    <div className="yaxii-shipping-manager-app min-h-screen bg-background text-foreground">
      <Header
        pluginVersion={bootstrap.pluginVersion}
        onLaunchWizard={() => setWizardOpen(true)}
        launchDisabled={!datasetReady}
      />
      <TopNav tab={tab} setTab={setTab} />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <RuntimeNotices bootstrap={bootstrap} datasetState={datasetState} />
        {tab === "zones" && (
          <ZonesScreen
            wilayas={wilayas}
            setWilayas={setWilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
          />
        )}
        {tab === "generator" && (
          <GeneratorHub onLaunch={() => setWizardOpen(true)} launchDisabled={!datasetReady} />
        )}
        {tab === "diagnostics" && <DiagnosticsScreen wilayas={wilayas} />}
        {tab === "import" && <ImportExportScreen />}
        {tab === "settings" && <SettingsScreen />}
        {tab === "sync" && <SmartFormSyncScreen />}
      </main>
      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-muted-foreground">
        Yaxii Shipping Manager - Local draft UI - No WooCommerce changes are made yet
      </footer>
      <div id="yaxii-shipping-manager-admin-portal" />

      {wizardOpen && (
        <GeneratorWizard
          baseList={wilayasToReference(wilayas)}
          onClose={() => setWizardOpen(false)}
          onComplete={(next, defs) => {
            setWilayas(next);
            setMethodDefs(defs);
            setWizardOpen(false);
            setTab("zones");
          }}
        />
      )}
    </div>
  );
}

function getInitialTab(): TabId {
  if (typeof window === "undefined") {
    return "zones";
  }

  const fromHash = window.location.hash.replace(/^#\/?/, "");
  return isTabId(fromHash) ? fromHash : "zones";
}

function isTabId(value: string): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function datasetRecordsToWilayas(
  records: WilayaDatasetRecord[],
  methodDefs: MethodDef[],
): Wilaya[] {
  return records.map((record) => {
    const methods: Record<string, Method> = {};
    methodDefs.forEach((method) => {
      methods[method.key] = {
        id: method.key,
        label: method.label,
        price: method.defaultPrice,
        enabled: true,
      };
    });

    return {
      code: record.code,
      name: record.name_fr,
      ar: record.name_ar,
      enabled: record.supported,
      status: "ready",
      methods,
    };
  });
}

function enabledMethodDefs(methods: ShippingMethodTemplate[]): MethodDef[] {
  return methods
    .filter((method) => method.enabled)
    .map((method) => ({
      key: method.key,
      label: method.label,
      defaultPrice: method.defaultPrice,
      locked: method.locked,
    }));
}

function wilayasToReference(wilayas: Wilaya[]): WilayaReference[] {
  return wilayas.map((wilaya) => ({ code: wilaya.code, name: wilaya.name, ar: wilaya.ar }));
}

function RuntimeNotices({
  bootstrap,
  datasetState,
}: {
  bootstrap: BootstrapPayload;
  datasetState: DatasetLoadState;
}) {
  return (
    <div className="mb-6 space-y-3">
      {!bootstrap.woocommerceActive && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>WooCommerce is inactive</AlertTitle>
          <AlertDescription>
            The admin UI can load, but WooCommerce-specific diagnostics and future apply actions
            remain unavailable.
          </AlertDescription>
        </Alert>
      )}
      <Alert className="border-primary/20 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Local draft only</AlertTitle>
        <AlertDescription>
          This screen does not write to WooCommerce. Diagnostics, preview planning, CSV import, and
          safe apply are later tasks.
        </AlertDescription>
      </Alert>
      {datasetState.status === "loading" && (
        <Alert className="border-primary/20 bg-primary/5">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Loading normalized dataset</AlertTitle>
          <AlertDescription>Fetching current wilayas from the local REST dataset.</AlertDescription>
        </Alert>
      )}
      {datasetState.status === "error" && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dataset unavailable</AlertTitle>
          <AlertDescription>{datasetState.message}</AlertDescription>
        </Alert>
      )}
      {datasetState.status === "ready" && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Current candidate dataset loaded</AlertTitle>
          <AlertDescription>
            {datasetState.records.length} wilaya rows loaded from version{" "}
            {datasetState.metadataVersion}. Verification remains pending.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function Header({
  pluginVersion,
  onLaunchWizard,
  launchDisabled,
}: {
  pluginVersion: string;
  onLaunchWizard: () => void;
  launchDisabled: boolean;
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Package className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Yaxii Shipping Manager</h1>
          <p className="text-sm text-muted-foreground">Algeria shipping setup for WooCommerce</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          v{pluginVersion} - Free
        </Badge>
        <Button onClick={onLaunchWizard} className="gap-2" disabled={launchDisabled}>
          <Wand2 className="h-4 w-4" /> Launch generator
        </Button>
      </div>
    </header>
  );
}

function TopNav({ tab, setTab }: { tab: TabId; setTab: (tab: TabId) => void }) {
  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function GeneratorHub({
  onLaunch,
  launchDisabled,
}: {
  onLaunch: () => void;
  launchDisabled: boolean;
}) {
  return (
    <>
      <SectionHeader
        title="Generator"
        description="Prepare a local shipping-zone draft through a guided setup path."
      />
      <Card className="overflow-hidden border-primary/30">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Guided shipping setup</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Pick the dataset mode, choose how prices will be entered, define the methods you
                ship with, and preview a local draft.
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <BulletItem>Current Algeria dataset</BulletItem>
                <BulletItem>Legacy 58-compatible dataset</BulletItem>
                <BulletItem>CSV import path prepared, backend not connected yet</BulletItem>
                <BulletItem>No WooCommerce changes are made yet</BulletItem>
              </ul>
              <Button className="mt-6 gap-2" onClick={onLaunch} disabled={launchDisabled}>
                <Wand2 className="h-4 w-4" /> Start generator
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

function BulletItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

function GeneratorWizard({
  baseList,
  onClose,
  onComplete,
}: {
  baseList: WilayaReference[];
  onClose: () => void;
  onComplete: (wilayas: Wilaya[], defs: MethodDef[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [setupPath, setSetupPathState] = useState<SetupPath>(DEFAULT_GENERATOR_DRAFT.setupPath);
  const [dataset, setDataset] = useState<DatasetMode>(DEFAULT_GENERATOR_DRAFT.datasetMode);
  const [labelFormat, setLabelFormat] = useState<RegionLabelFormat>(
    DEFAULT_GENERATOR_DRAFT.labelFormat,
  );
  const [zoneNameFormat, setZoneNameFormat] = useState<ZoneNameFormat>(
    DEFAULT_GENERATOR_DRAFT.zoneNaming.format,
  );
  const [zonePrefix, setZonePrefix] = useState(DEFAULT_GENERATOR_DRAFT.zoneNaming.prefix);
  const [officeWording, setOfficeWording] = useState<OfficeMethodWording>(
    DEFAULT_GENERATOR_DRAFT.officeMethodWording,
  );
  const [officeCustomLabel, setOfficeCustomLabel] = useState("Office delivery");
  const [methods, setMethods] = useState<ShippingMethodTemplate[]>(DEFAULT_GENERATOR_DRAFT.methods);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    baseList.map((wilaya) => wilaya.code),
  );

  const steps = [
    "Setup path",
    "Dataset mode",
    "Label/naming",
    "Shipping methods",
    "Default prices",
    "Wilaya selection",
    "Review draft",
  ] as const;
  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const setSetupPath = (nextSetupPath: SetupPath) => {
    setSetupPathState(nextSetupPath);
    if (nextSetupPath === "quick") {
      setSelectedCodes(baseList.map((wilaya) => wilaya.code));
    }
  };

  const activeMethodDefs = enabledMethodDefs(methods);
  const selectedWilayaCount = selectedCodes.length;

  const buildDraft = (): Wilaya[] => {
    const selected = new Set(selectedCodes);

    return baseList.map((wilaya) => {
      const rowEnabled = selected.has(wilaya.code);
      const formattedName = formatRegionLabel(
        { nameFr: wilaya.name, nameAr: wilaya.ar },
        labelFormat,
      );
      const draftMethods: Record<string, Method> = {};

      methods.forEach((method) => {
        if (!method.enabled) {
          return;
        }

        const price = method.defaultPrice === null ? undefined : method.defaultPrice;
        draftMethods[method.key] = {
          id: method.key,
          label: method.label,
          enabled: rowEnabled && price !== undefined,
          price,
        };
      });

      return {
        code: wilaya.code,
        name: formattedName,
        ar: wilaya.ar,
        enabled: rowEnabled,
        status: "ready",
        methods: draftMethods,
      };
    });
  };

  const useLocalDraft = () => onComplete(buildDraft(), activeMethodDefs);

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Shipping generator</div>
            <div className="text-xs text-muted-foreground">
              Step {step + 1} of {steps.length} - {steps[step]}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-4">
          <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {steps.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                    index < step && "bg-primary text-primary-foreground",
                    index === step && "bg-primary/20 text-primary",
                    index > step && "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    index === step ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">
          {step === 0 && <StepSetupPath setupPath={setupPath} setSetupPath={setSetupPath} />}
          {step === 1 && <StepDataset dataset={dataset} setDataset={setDataset} />}
          {step === 2 && (
            <StepLabelNaming
              baseList={baseList}
              labelFormat={labelFormat}
              setLabelFormat={setLabelFormat}
              zoneNameFormat={zoneNameFormat}
              setZoneNameFormat={setZoneNameFormat}
              zonePrefix={zonePrefix}
              setZonePrefix={setZonePrefix}
            />
          )}
          {step === 3 && (
            <StepMethods
              methods={methods}
              setMethods={setMethods}
              officeWording={officeWording}
              setOfficeWording={setOfficeWording}
              officeCustomLabel={officeCustomLabel}
              setOfficeCustomLabel={setOfficeCustomLabel}
            />
          )}
          {step === 4 && <StepDefaultPrices methods={methods} setMethods={setMethods} />}
          {step === 5 && (
            <StepWilayaSelection
              baseList={baseList}
              selectedCodes={selectedCodes}
              setSelectedCodes={setSelectedCodes}
            />
          )}
          {step === 6 && (
            <StepReview
              setupPath={setupPath}
              baseList={baseList}
              methods={methods}
              dataset={dataset}
              labelFormat={labelFormat}
              zoneNameFormat={zoneNameFormat}
              zonePrefix={zonePrefix}
              selectedWilayaCount={selectedWilayaCount}
            />
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="text-xs text-muted-foreground">
            This wizard only updates the local admin draft.
          </div>
          {step < steps.length - 1 ? (
            <Button onClick={next}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={useLocalDraft} className="gap-2">
              <Sparkles className="h-4 w-4" /> Use local draft
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepSetupPath({
  setupPath,
  setSetupPath,
}: {
  setupPath: SetupPath;
  setSetupPath: (setupPath: SetupPath) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Choose a setup path</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Each path prepares a local draft only. WooCommerce preview and apply are later tasks.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {SETUP_PATH_OPTIONS.map((option) => (
          <ImportPathCard
            key={option.value}
            active={setupPath === option.value}
            onClick={() => setSetupPath(option.value)}
            icon={setupPathIcon(option.value)}
            title={option.label}
            desc={option.description ?? ""}
          />
        ))}
      </div>
      {setupPath === "csv" && (
        <Alert className="mt-6 border-amber-200 bg-amber-50 text-amber-950">
          <FileUp className="h-4 w-4" />
          <AlertTitle>CSV backend is not connected yet</AlertTitle>
          <AlertDescription>
            This path is represented in the contract, but file upload and validation are future
            backend work.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function setupPathIcon(setupPath: SetupPath): ReactNode {
  if (setupPath === "quick") {
    return <Wand2 className="h-4 w-4" />;
  }

  if (setupPath === "csv") {
    return <FileSpreadsheet className="h-4 w-4" />;
  }

  return <Edit3 className="h-4 w-4" />;
}

function StepDataset({
  dataset,
  setDataset,
}: {
  dataset: DatasetMode;
  setDataset: (dataset: DatasetMode) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Pick your wilaya dataset mode</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Current mode is available. Legacy compatibility remains unavailable until mapping is
        auditable.
      </p>
      <RadioGroup
        value={dataset}
        onValueChange={(value) => {
          const option = DATASET_MODE_OPTIONS.find((entry) => entry.mode === value);
          if (option?.available) {
            setDataset(option.mode);
          }
        }}
        className="mt-6 space-y-3"
      >
        {DATASET_MODE_OPTIONS.map((option) => (
          <DatasetCard
            key={option.mode}
            value={option.mode}
            current={dataset}
            title={option.label}
            desc={option.reason ?? "Use the normalized current candidate dataset."}
            badge={option.recommended ? "Recommended" : undefined}
            disabled={!option.available}
          />
        ))}
      </RadioGroup>
    </div>
  );
}

function DatasetCard({
  value,
  current,
  title,
  desc,
  badge,
  disabled,
}: {
  value: DatasetMode;
  current: DatasetMode;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
}) {
  const active = value === current;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-5 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-60 hover:border-border",
      )}
    >
      <RadioGroupItem value={value} className="mt-1" disabled={disabled} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium">{title}</div>
          {badge && (
            <Badge variant="secondary" className="rounded-full text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}

function StepLabelNaming({
  baseList,
  labelFormat,
  setLabelFormat,
  zoneNameFormat,
  setZoneNameFormat,
  zonePrefix,
  setZonePrefix,
}: {
  baseList: WilayaReference[];
  labelFormat: RegionLabelFormat;
  setLabelFormat: (format: RegionLabelFormat) => void;
  zoneNameFormat: ZoneNameFormat;
  setZoneNameFormat: (format: ZoneNameFormat) => void;
  zonePrefix: string;
  setZonePrefix: (prefix: string) => void;
}) {
  const sampleWilaya = baseList[0] ?? { code: "16", name: "Alger", ar: "الجزائر" };
  const sampleLabel = formatRegionLabel(
    { nameFr: sampleWilaya.name, nameAr: sampleWilaya.ar },
    labelFormat,
  );
  const sampleZoneName = zoneNamePreview({
    format: zoneNameFormat,
    prefix: zonePrefix,
    code: sampleWilaya.code,
    name: sampleLabel,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Choose label and zone naming</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        These choices only affect local draft labels until settings persistence exists.
      </p>
      <Card className="mt-6">
        <CardContent className="space-y-6 p-6">
          <SettingRow label="Region label format" desc="Controls how wilayas appear in draft rows.">
            <Select
              value={labelFormat}
              onValueChange={(value) => setLabelFormat(value as RegionLabelFormat)}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGION_LABEL_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label="Zone name format" desc="Draft naming only; no zones are written.">
            <Select
              value={zoneNameFormat}
              onValueChange={(value) => setZoneNameFormat(value as ZoneNameFormat)}
            >
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONE_NAMING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Zone prefix" desc="Default local draft prefix.">
            <Input
              value={zonePrefix}
              onChange={(event) => setZonePrefix(event.target.value)}
              className="w-44"
            />
          </SettingRow>
          <Separator />
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="text-xs font-medium uppercase text-muted-foreground">Preview</div>
            <div className="mt-2 font-medium">{sampleZoneName}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepMethods({
  methods,
  setMethods,
  officeWording,
  setOfficeWording,
  officeCustomLabel,
  setOfficeCustomLabel,
}: {
  methods: ShippingMethodTemplate[];
  setMethods: Dispatch<SetStateAction<ShippingMethodTemplate[]>>;
  officeWording: OfficeMethodWording;
  setOfficeWording: (wording: OfficeMethodWording) => void;
  officeCustomLabel: string;
  setOfficeCustomLabel: (label: string) => void;
}) {
  const updateMethod = (
    key: ShippingMethodKey,
    patch: Partial<Pick<ShippingMethodTemplate, "enabled" | "label">>,
  ) => {
    setMethods((previous) =>
      previous.map((method) => (method.key === key ? { ...method, ...patch } : method)),
    );
  };

  const updateOfficeWording = (wording: OfficeMethodWording) => {
    setOfficeWording(wording);
    updateMethod("office_delivery", { label: officeLabelForWording(wording, officeCustomLabel) });
  };

  const updateOfficeCustomLabel = (label: string) => {
    setOfficeCustomLabel(label);
    if (officeWording === "custom") {
      updateMethod("office_delivery", { label: officeLabelForWording("custom", label) });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Define your shipping methods</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Home delivery and office/stopdesk delivery are required. Two custom methods are available
        for the MVP, but unlimited methods are not part of this contract.
      </p>
      <Card className="mt-6">
        <CardContent className="space-y-6 p-6">
          <SettingRow label="Office method wording" desc="Controls the office_delivery label.">
            <Select
              value={officeWording}
              onValueChange={(value) => updateOfficeWording(value as OfficeMethodWording)}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFICE_METHOD_WORDING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          {officeWording === "custom" && (
            <SettingRow label="Office custom label" desc="Local draft label only.">
              <Input
                value={officeCustomLabel}
                onChange={(event) => updateOfficeCustomLabel(event.target.value)}
                className="w-56"
              />
            </SettingRow>
          )}
          <Separator />
          <div className="space-y-2">
            {methods.map((method) => (
              <div
                key={method.key}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Package className="h-4 w-4" />
                </div>
                <Switch
                  checked={method.enabled}
                  disabled={method.locked}
                  onCheckedChange={(enabled) => updateMethod(method.key, { enabled })}
                />
                <Input
                  value={method.label}
                  onChange={(event) => updateMethod(method.key, { label: event.target.value })}
                  className="h-8 min-w-48 flex-1"
                />
                <code className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                  {method.key}
                </code>
                {method.locked && <Badge variant="outline">Required</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepDefaultPrices({
  methods,
  setMethods,
}: {
  methods: ShippingMethodTemplate[];
  setMethods: Dispatch<SetStateAction<ShippingMethodTemplate[]>>;
}) {
  const setDefaultPrice = (key: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice === undefined) {
      return;
    }

    setMethods((previous) =>
      previous.map((method) =>
        method.key === key ? { ...method, defaultPrice: nextPrice } : method,
      ),
    );
  };

  const visibleMethods = methods.filter((method) => method.locked || method.enabled);

  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Set default prices</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Empty prices stay unset in the local draft. Negative values are rejected by the UI.
      </p>
      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          {visibleMethods.map((method) => (
            <SettingRow
              key={method.key}
              label={`${method.label} default price`}
              desc={
                method.locked ? "Required MVP method." : "Shown only while this method is enabled."
              }
            >
              <Input
                type="number"
                min={0}
                value={method.defaultPrice ?? ""}
                placeholder="Unset"
                onChange={(event) => setDefaultPrice(method.key, event.target.value)}
                className="w-36"
              />
            </SettingRow>
          ))}
          <Separator />
          <div className="text-sm text-muted-foreground">
            Currency comes from WooCommerce. Fallback: DZD.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImportPathCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-4 text-left transition-all",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
      )}
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

function StepWilayaSelection({
  baseList,
  selectedCodes,
  setSelectedCodes,
}: {
  baseList: WilayaReference[];
  selectedCodes: string[];
  setSelectedCodes: (selectedCodes: string[]) => void;
}) {
  const selected = new Set(selectedCodes);
  const toggleWilaya = (code: string, checked: boolean) => {
    setSelectedCodes(
      checked
        ? [...selectedCodes, code]
        : selectedCodes.filter((selectedCode) => selectedCode !== code),
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Select wilayas</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Selected wilayas are enabled in the local draft. Unselected rows remain visible but
        disabled.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => setSelectedCodes(baseList.map((wilaya) => wilaya.code))}
        >
          Select all
        </Button>
        <Button variant="outline" onClick={() => setSelectedCodes([])}>
          Clear selection
        </Button>
        <Badge variant="secondary" className="rounded-full">
          {selectedCodes.length} selected
        </Badge>
      </div>
      <Card className="mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Use</TableHead>
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Wilaya</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baseList.map((wilaya) => {
              const checked = selected.has(wilaya.code);
              return (
                <TableRow key={wilaya.code}>
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleWilaya(wilaya.code, Boolean(value))}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {wilaya.code}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{wilaya.name}</div>
                    <div className="text-xs text-muted-foreground">{wilaya.ar}</div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StepReview({
  setupPath,
  baseList,
  methods,
  dataset,
  labelFormat,
  zoneNameFormat,
  zonePrefix,
  selectedWilayaCount,
}: {
  setupPath: SetupPath;
  baseList: WilayaReference[];
  methods: ShippingMethodTemplate[];
  dataset: DatasetMode;
  labelFormat: RegionLabelFormat;
  zoneNameFormat: ZoneNameFormat;
  zonePrefix: string;
  selectedWilayaCount: number;
}) {
  const sampleWilaya = baseList[0] ?? { code: "16", name: "Alger", ar: "الجزائر" };
  const enabledMethods = methods.filter((method) => method.enabled);
  const pricedMethods = enabledMethods.filter((method) => method.defaultPrice !== null).length;
  const sampleLabel = formatRegionLabel(
    { nameFr: sampleWilaya.name, nameAr: sampleWilaya.ar },
    labelFormat,
  );
  const sampleZoneName = zoneNamePreview({
    format: zoneNameFormat,
    prefix: zonePrefix,
    code: sampleWilaya.code,
    name: sampleLabel,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Review draft</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This is a local draft. WooCommerce preview/apply will be added after diagnostics and preview
        planner.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStat label="Setup path" value={setupPathLabel(setupPath)} />
        <PreviewStat label="Dataset mode" value={dataset === "current" ? "Current" : "Legacy"} />
        <PreviewStat label="Selected wilayas" value={String(selectedWilayaCount)} />
        <PreviewStat label="Enabled methods" value={String(enabledMethods.length)} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Draft contract</CardTitle>
          <CardDescription>No WooCommerce zone reads or writes are performed here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Sample zone name</span>
            <Badge variant="outline">{sampleZoneName}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Methods with default prices</span>
            <Badge variant="outline">{pricedMethods}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Locked safety rules</span>
            <Badge variant="outline">{SAFETY_RULES.length}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function setupPathLabel(setupPath: SetupPath): string {
  return SETUP_PATH_OPTIONS.find((option) => option.value === setupPath)?.label ?? "Manual setup";
}

function parseOptionalPrice(rawValue: string): number | null | undefined {
  if (rawValue.trim() === "") {
    return null;
  }

  const amount = Number(rawValue);
  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className={cn("text-2xl font-semibold", tone === "warn" && "text-amber-600")}>
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

const STATUS_META: Record<WilayaStatus, { label: string; dot: string; pill: string }> = {
  ready: {
    label: "Draft",
    dot: "bg-emerald-500",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  managed: {
    label: "Local",
    dot: "bg-primary",
    pill: "border-primary/20 bg-primary/5 text-primary",
  },
  needs_update: {
    label: "Needs review",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  missing: {
    label: "Disabled",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  manual: {
    label: "Manual note",
    dot: "bg-slate-400",
    pill: "border-slate-200 bg-slate-50 text-slate-700",
  },
  conflict: { label: "Review", dot: "bg-red-500", pill: "border-red-200 bg-red-50 text-red-700" },
};

function StatusPill({ status }: { status: WilayaStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function ZonesScreen({
  wilayas,
  setWilayas,
  methodDefs,
  onLaunchWizard,
}: {
  wilayas: Wilaya[];
  setWilayas: (wilayas: Wilaya[]) => void;
  methodDefs: MethodDef[];
  onLaunchWizard: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [targetMethod, setTargetMethod] = useState<string>(methodDefs[0]?.key ?? "home_delivery");
  const [bulkPrice, setBulkPrice] = useState("");
  const [pct, setPct] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<Wilaya[] | null>(null);

  if (wilayas.length === 0) {
    return (
      <>
        <SectionHeader title="Shipping Zones" description="No local draft rows yet." />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">
                Create your first Algeria shipping draft
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a dataset mode, set prices, then preview the local draft.
              </p>
            </div>
            <Button onClick={onLaunchWizard}>
              <Wand2 className="h-4 w-4" /> Open generator
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const hasSelection = selected.length > 0;
  const toggleAll = (value: boolean) =>
    setSelected(value ? wilayas.map((wilaya) => wilaya.code) : []);
  const updateRow = (code: string, patch: Partial<Wilaya>) =>
    setWilayas(wilayas.map((wilaya) => (wilaya.code === code ? { ...wilaya, ...patch } : wilaya)));
  const updateMethod = (code: string, methodId: string, patch: Partial<Method>) =>
    setWilayas(
      wilayas.map((wilaya) =>
        wilaya.code === code
          ? {
              ...wilaya,
              methods: {
                ...wilaya.methods,
                [methodId]: {
                  ...(wilaya.methods[methodId] ?? {
                    id: methodId,
                    label: methodDefs.find((method) => method.key === methodId)?.label ?? methodId,
                    enabled: true,
                    price: undefined,
                  }),
                  ...patch,
                },
              },
            }
          : wilaya,
      ),
    );
  const buildPreview = (transform: (wilaya: Wilaya) => Wilaya): Wilaya[] =>
    wilayas.map((wilaya) => (selected.includes(wilaya.code) ? transform(wilaya) : wilaya));

  const previewBulkPrice = () => {
    const price = Number(bulkPrice);
    if (!price) {
      return;
    }

    setPending(
      buildPreview((wilaya) => ({
        ...wilaya,
        methods: {
          ...wilaya.methods,
          [targetMethod]: {
            ...(wilaya.methods[targetMethod] ?? {
              id: targetMethod,
              label: targetMethod,
              enabled: true,
              price,
            }),
            price,
            enabled: true,
          },
        },
      })),
    );
    setConfirmOpen(true);
  };

  const previewPercent = () => {
    const percent = Number(pct);
    if (!percent) {
      return;
    }

    setPending(
      buildPreview((wilaya) => {
        const method = wilaya.methods[targetMethod];
        if (!method || typeof method.price !== "number") {
          return wilaya;
        }

        return {
          ...wilaya,
          methods: {
            ...wilaya.methods,
            [targetMethod]: { ...method, price: Math.round(method.price * (1 + percent / 100)) },
          },
        };
      }),
    );
    setConfirmOpen(true);
  };

  const makeFree = () => {
    setPending(
      buildPreview((wilaya) => {
        const method = wilaya.methods[targetMethod] ?? {
          id: targetMethod,
          label: targetMethod,
          enabled: true,
          price: null,
        };
        return {
          ...wilaya,
          methods: { ...wilaya.methods, [targetMethod]: { ...method, price: null, enabled: true } },
        };
      }),
    );
    setConfirmOpen(true);
  };

  const disableMethod = () => {
    setPending(
      buildPreview((wilaya) => {
        const method = wilaya.methods[targetMethod];
        if (!method) {
          return wilaya;
        }

        return {
          ...wilaya,
          methods: { ...wilaya.methods, [targetMethod]: { ...method, enabled: false } },
        };
      }),
    );
    setConfirmOpen(true);
  };

  const setWilayaEnabled = (value: boolean) =>
    setPending(buildPreview((wilaya) => ({ ...wilaya, enabled: value })));
  const confirm = () => {
    if (pending) {
      setWilayas(pending);
    }
    setPending(null);
    setConfirmOpen(false);
    setBulkPrice("");
    setPct("");
  };

  return (
    <>
      <SectionHeader
        title="Shipping Zones"
        description="Manage wilaya shipping prices in a local draft. No WooCommerce changes are made yet."
        action={
          <Button variant="outline" onClick={onLaunchWizard}>
            <Wand2 className="h-4 w-4" /> Open generator
          </Button>
        }
      />

      {hasSelection && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{selected.length} selected</Badge>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-xs text-muted-foreground">Update method:</span>
            <Select value={targetMethod} onValueChange={setTargetMethod}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methodDefs.map((method) => (
                  <SelectItem key={method.key} value={method.key}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Price"
                value={bulkPrice}
                onChange={(event) => setBulkPrice(event.target.value)}
                className="h-8 w-24"
              />
              <Button size="sm" variant="outline" onClick={previewBulkPrice} disabled={!bulkPrice}>
                <DollarSign className="h-4 w-4" /> Set local price
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="%"
                value={pct}
                onChange={(event) => setPct(event.target.value)}
                className="h-8 w-16"
              />
              <Button size="sm" variant="outline" onClick={previewPercent} disabled={!pct}>
                <Percent className="h-4 w-4" /> Adjust local
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={makeFree}>
              Make free
            </Button>
            <Button size="sm" variant="outline" onClick={disableMethod}>
              <PowerOff className="h-4 w-4" /> Disable method
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setWilayaEnabled(true);
                setConfirmOpen(true);
              }}
            >
              <Power className="h-4 w-4" /> Enable rows
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setWilayaEnabled(false);
                setConfirmOpen(true);
              }}
            >
              <PowerOff className="h-4 w-4" /> Disable rows
            </Button>
            <div className="ml-auto">
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                <X className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === wilayas.length}
                  onCheckedChange={(value) => toggleAll(Boolean(value))}
                />
              </TableHead>
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              <TableHead className="w-20">Enabled</TableHead>
              {methodDefs.map((method) => (
                <TableHead key={method.key} className="w-36">
                  {method.label}
                </TableHead>
              ))}
              <TableHead className="w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wilayas.map((wilaya) => {
              const isSelected = selected.includes(wilaya.code);
              return (
                <TableRow key={wilaya.code} data-state={isSelected ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(value) =>
                        setSelected(
                          value
                            ? [...selected, wilaya.code]
                            : selected.filter((code) => code !== wilaya.code),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {wilaya.code}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{wilaya.name}</div>
                    <div className="text-xs text-muted-foreground">{wilaya.ar}</div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={wilaya.enabled}
                      onCheckedChange={(value) => updateRow(wilaya.code, { enabled: value })}
                    />
                  </TableCell>
                  {methodDefs.map((method) => {
                    const value = wilaya.methods[method.key];
                    return (
                      <TableCell key={method.key}>
                        <MethodCell
                          method={value}
                          onChange={(patch) => updateMethod(wilaya.code, method.key, patch)}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <StatusPill status={wilaya.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(value) => {
          setConfirmOpen(value);
          if (!value) setPending(null);
        }}
        title="Preview local draft changes?"
        description={
          pending
            ? `${selected.length} row(s) will be updated in the local draft. No WooCommerce zones are changed.`
            : "No local draft changes to preview."
        }
        confirmLabel="Update local draft"
        onConfirm={confirm}
      />
    </>
  );
}

function MethodCell({
  method,
  onChange,
}: {
  method?: Method;
  onChange: (patch: Partial<Method>) => void;
}) {
  if (!method) {
    return (
      <button
        type="button"
        onClick={() => onChange({ enabled: true, price: 0 })}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        - add
      </button>
    );
  }
  if (!method.enabled) {
    return (
      <button
        type="button"
        onClick={() => onChange({ enabled: true })}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <PowerOff className="h-3 w-3" /> Off
      </button>
    );
  }
  if (method.price === null) {
    return (
      <button
        type="button"
        onClick={() => onChange({ price: 0 })}
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
      >
        Free
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={method.price ?? ""}
        onChange={(event) => onChange({ price: Number(event.target.value) })}
        className="h-8"
      />
    </div>
  );
}

type CheckResult = {
  id: string;
  label: string;
  detail: string;
  status: "ok" | "warn" | "fail";
};

function DiagnosticsScreen({ wilayas }: { wilayas: Wilaya[] }) {
  const [state, setState] = useState<"idle" | "done">("idle");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [sim, setSim] = useState<string | null>(null);

  const run = () => {
    const missing = wilayas.filter((wilaya) => !wilaya.enabled).length;
    const conflicts = wilayas.filter((wilaya) => wilaya.status === "conflict").length;
    setResults([
      {
        id: "backend",
        label: "Diagnostics backend",
        detail: "Backend not connected yet",
        status: "warn",
      },
      {
        id: "woo",
        label: "WooCommerce status",
        detail: "Read-only WooCommerce diagnostics are coming in a later task",
        status: "warn",
      },
      {
        id: "draft",
        label: "Local draft rows",
        detail: `${wilayas.length} local draft row(s) loaded`,
        status: wilayas.length ? "ok" : "warn",
      },
      {
        id: "missing",
        label: "Disabled rows",
        detail: missing ? `${missing} local row(s) disabled` : "No disabled local rows",
        status: missing ? "warn" : "ok",
      },
      {
        id: "conflict",
        label: "Rows needing review",
        detail: conflicts
          ? `${conflicts} local row(s) marked for review`
          : "No local rows marked for review",
        status: conflicts ? "warn" : "ok",
      },
      {
        id: "checkout",
        label: "Checkout Protection",
        detail: "Checkout backend coming in a later task",
        status: "warn",
      },
    ]);
    setState("done");
  };

  const summary = useMemo(() => {
    const ok = results.filter((result) => result.status === "ok").length;
    const warn = results.filter((result) => result.status === "warn").length;
    const fail = results.filter((result) => result.status === "fail").length;
    return { ok, warn, fail };
  }, [results]);

  return (
    <>
      <SectionHeader
        title="Checkout Protection"
        description="Diagnostics backend coming in a later task. Current checks only inspect the local draft."
        action={
          <Button onClick={run}>
            <RefreshCw className="h-4 w-4" />
            {state === "done" ? "Refresh draft check" : "Show draft check"}
          </Button>
        }
      />

      {state === "idle" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold">Diagnostics backend not connected yet</div>
            <p className="max-w-md text-sm text-muted-foreground">
              Use the draft check to review local rows. Real WooCommerce diagnostics will be added
              after the backend task.
            </p>
            <Button onClick={run}>
              <Activity className="h-4 w-4" /> Show draft check
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "done" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Local checks" value={summary.ok} tone="ok" />
            <SummaryStat label="Warnings" value={summary.warn} tone="warn" />
            <SummaryStat label="Failures" value={summary.fail} tone="fail" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((result) => (
              <HealthCard key={result.id} result={result} />
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> Draft checkout preview
              </CardTitle>
              <CardDescription>
                Pick a wilaya to see which local draft methods would be offered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={sim ?? ""} onValueChange={setSim}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a wilaya..." />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} - {wilaya.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sim && <CheckoutSim wilaya={wilayas.find((wilaya) => wilaya.code === sim)!} />}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "fail";
}) {
  const color =
    tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-red-600";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={cn("text-2xl font-semibold", color)}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function HealthCard({ result }: { result: CheckResult }) {
  const Icon =
    result.status === "ok" ? CheckCircle2 : result.status === "warn" ? AlertTriangle : AlertCircle;
  const tone =
    result.status === "ok"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : result.status === "warn"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium">{result.label}</div>
          <div className="text-xs text-muted-foreground">{result.detail}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckoutSim({ wilaya }: { wilaya: Wilaya }) {
  const offered = Object.values(wilaya.methods).filter(
    (method) => method.enabled && method.price !== undefined,
  );
  const ok = wilaya.enabled && offered.length > 0;
  return (
    <div className="mt-5 rounded-lg border border-border bg-muted/30 p-5">
      {ok ? (
        <>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Local draft shipping methods
          </div>
          <div className="mt-3 space-y-2">
            {offered.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{method.label}</span>
                <span className="font-medium">
                  {method.price === null ? "Free" : `${method.price} DZD`}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No local draft shipping method available</AlertTitle>
          <AlertDescription>{wilaya.name} has no enabled local draft method.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ImportExportScreen() {
  return (
    <>
      <SectionHeader
        title="Import / Export"
        description="Prepare CSV movement for shipping configurations. Backend import and export are not connected yet."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import CSV</CardTitle>
            <CardDescription>Upload validation is coming in a later task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-8 text-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">CSV backend not connected yet</div>
              <Button variant="outline" size="sm" disabled>
                Select file
              </Button>
            </div>
            <Button className="w-full" disabled>
              Validate and preview import
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export</CardTitle>
            <CardDescription>Download endpoints are coming in a later task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExportRow
              title="Local draft configuration"
              desc="Wilayas, prices, and labels currently visible in this admin draft."
            />
            <ExportRow
              title="WooCommerce snapshot"
              desc="Read-only WooCommerce zone snapshot backend not connected yet."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ExportRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Button variant="outline" size="sm" disabled>
        <Download className="h-4 w-4" /> Export
      </Button>
    </div>
  );
}

function SettingsScreen() {
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS_DRAFT);
  const [methods, setMethods] = useState(DEFAULT_SHIPPING_METHOD_TEMPLATES);
  const [officeCustomLabel, setOfficeCustomLabel] = useState("Office delivery");

  const updateSettingsDraft = (patch: Partial<typeof settingsDraft>) => {
    setSettingsDraft((current) => ({ ...current, ...patch }));
  };

  const updateMethod = (
    key: ShippingMethodKey,
    patch: Partial<Pick<ShippingMethodTemplate, "enabled" | "label" | "defaultPrice">>,
  ) => {
    setMethods((current) =>
      current.map((method) => (method.key === key ? { ...method, ...patch } : method)),
    );
  };

  const updateOfficeWording = (wording: OfficeMethodWording) => {
    updateSettingsDraft({ officeMethodWording: wording });
    updateMethod("office_delivery", { label: officeLabelForWording(wording, officeCustomLabel) });
  };

  const updateOfficeCustomLabel = (label: string) => {
    setOfficeCustomLabel(label);
    if (settingsDraft.officeMethodWording === "custom") {
      updateMethod("office_delivery", { label: officeLabelForWording("custom", label) });
    }
  };

  const updateDefaultPrice = (key: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice !== undefined) {
      updateMethod(key, { defaultPrice: nextPrice });
    }
  };

  return (
    <>
      <SectionHeader
        title="Settings"
        description="Local defaults shown in the admin draft. Settings persistence is not connected yet."
      />
      <Card>
        <CardContent className="space-y-6 p-6">
          <SettingRow label="Dataset mode" desc="Legacy mapping is not available yet.">
            <Select
              value={settingsDraft.datasetMode}
              onValueChange={(value) => {
                const option = DATASET_MODE_OPTIONS.find((entry) => entry.mode === value);
                if (option?.available) {
                  updateSettingsDraft({ datasetMode: option.mode });
                }
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATASET_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.mode} value={option.mode} disabled={!option.available}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label="Region label format" desc="Controls future zone naming previews.">
            <Select
              value={settingsDraft.regionLabelFormat}
              onValueChange={(value) =>
                updateSettingsDraft({ regionLabelFormat: value as RegionLabelFormat })
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGION_LABEL_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label="Zone name format" desc="Draft naming only; no zones are written.">
            <Select
              value={settingsDraft.zoneNameFormat}
              onValueChange={(value) =>
                updateSettingsDraft({ zoneNameFormat: value as ZoneNameFormat })
              }
            >
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONE_NAMING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Zone prefix" desc="Default local draft prefix.">
            <Input
              value={settingsDraft.zonePrefix}
              onChange={(event) => updateSettingsDraft({ zonePrefix: event.target.value })}
              className="w-44"
            />
          </SettingRow>
          <Separator />
          <SettingRow label="Office method wording" desc="Controls the office_delivery label.">
            <Select
              value={settingsDraft.officeMethodWording}
              onValueChange={(value) => updateOfficeWording(value as OfficeMethodWording)}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFICE_METHOD_WORDING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          {settingsDraft.officeMethodWording === "custom" && (
            <SettingRow label="Office custom label" desc="Local draft label only.">
              <Input
                value={officeCustomLabel}
                onChange={(event) => updateOfficeCustomLabel(event.target.value)}
                className="w-56"
              />
            </SettingRow>
          )}
          <Separator />
          <div className="text-sm text-muted-foreground">
            Currency comes from WooCommerce. Fallback: DZD.
          </div>
          <Separator />
          {methods.map((method) => (
            <SettingRow
              key={method.key}
              label={method.label}
              desc={method.locked ? "Required flat_rate method." : "Optional flat_rate method."}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Switch
                  checked={method.enabled}
                  disabled={method.locked}
                  onCheckedChange={(enabled) => updateMethod(method.key, { enabled })}
                />
                <Input
                  value={method.label}
                  onChange={(event) => updateMethod(method.key, { label: event.target.value })}
                  className="w-44"
                />
                {(method.locked || method.enabled) && (
                  <Input
                    type="number"
                    min={0}
                    value={method.defaultPrice ?? ""}
                    placeholder="Unset"
                    onChange={(event) => updateDefaultPrice(method.key, event.target.value)}
                    className="w-28"
                  />
                )}
              </div>
            </SettingRow>
          ))}
          <Separator />
          {SAFETY_RULES.map((rule) => (
            <ToggleRow
              key={rule.key}
              label={rule.label}
              desc="Required safety rule for the future apply engine."
              checked
              disabled
            />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  disabled,
}: {
  label: string;
  desc?: string;
  checked?: boolean;
  disabled?: boolean;
}) {
  return (
    <SettingRow label={label} desc={desc}>
      <Switch checked={checked} disabled={disabled} />
    </SettingRow>
  );
}

function SmartFormSyncScreen() {
  return (
    <>
      <SectionHeader title="Smart Form Sync" description="Coming later. No sync is active yet." />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <div className="max-w-md">
            <div className="text-base font-semibold">Coming later</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Yaxii Smart Form can later become the source of truth. No sync is active yet, and this
              screen performs no reads or writes.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
