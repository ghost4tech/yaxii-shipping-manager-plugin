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
import { fetchDiagnostics } from "../api/diagnostics-api";
import { fetchPreview } from "../api/preview-api";
import { fetchSettings, saveSettings } from "../api/settings-api";
import {
  DATASET_MODE_OPTIONS,
  DEFAULT_GENERATOR_DRAFT,
  DEFAULT_SETTINGS,
  DEFAULT_SHIPPING_METHOD_TEMPLATES,
  OFFICE_METHOD_WORDING_OPTIONS,
  REGION_LABEL_FORMAT_OPTIONS,
  SAFETY_RULES,
  SETUP_PATH_OPTIONS,
  ZONE_NAMING_OPTIONS,
  generatorDraftFromSettings,
  officeLabelForWording,
} from "../data/default-settings";
import { formatRegionLabel } from "../domain/format-region-label";
import { zoneNamePreview } from "../domain/zone-name-preview";
import type { DatasetMode, WilayaDatasetRecord } from "../types/dataset";
import type {
  CheckoutFallbackRisk,
  DiagnosticsResponse,
  WilayaDiagnosticStatus,
  ZoneDiagnostic,
} from "../types/diagnostics";
import type { ShippingMethodKey, ShippingMethodTemplate } from "../types/generator";
import type {
  ApplyReadiness,
  PreviewPlanItem,
  PreviewRequest,
  PreviewResponse,
} from "../types/preview";
import type {
  OfficeMethodWording,
  PersistedSettings,
  RegionLabelFormat,
  SettingsResponse,
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
type SettingsLoadState =
  | { status: "loading" }
  | { status: "ready"; response: SettingsResponse }
  | { status: "error"; message: string };
type DiagnosticsLoadState =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "ready"; response: DiagnosticsResponse }
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
  const [settingsState, setSettingsState] = useState<SettingsLoadState>({ status: "loading" });
  const [diagnosticsState, setDiagnosticsState] = useState<DiagnosticsLoadState>({
    status: "waiting",
  });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [methodDefs, setMethodDefs] = useState<MethodDef[]>(DEFAULT_METHOD_DEFS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [diagnosticsReloadKey, setDiagnosticsReloadKey] = useState(0);
  const [latestPreview, setLatestPreview] = useState<PreviewResponse | null>(null);

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
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetchSettings(config);
        if (!cancelled) {
          setSettingsState({ status: "ready", response });
        }
      } catch (error) {
        if (!cancelled) {
          setSettingsState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load saved settings.",
          });
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    if (datasetState.status !== "ready" || settingsState.status !== "ready") {
      setDiagnosticsState({ status: "waiting" });
      return;
    }

    const nextMethodDefs = enabledMethodDefs(settingsState.response.settings.methods);
    setMethodDefs(nextMethodDefs);
    setWilayas(datasetRecordsToWilayas(datasetState.records, nextMethodDefs));
  }, [datasetState, settingsState]);

  useEffect(() => {
    if (datasetState.status !== "ready" || settingsState.status !== "ready") {
      return;
    }

    let cancelled = false;

    async function loadDiagnostics() {
      setDiagnosticsState({ status: "loading" });

      try {
        const response = await fetchDiagnostics(config);
        if (!cancelled) {
          setDiagnosticsState({ status: "ready", response });
        }
      } catch (error) {
        if (!cancelled) {
          setDiagnosticsState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to load WooCommerce diagnostics.",
          });
        }
      }
    }

    loadDiagnostics();

    return () => {
      cancelled = true;
    };
  }, [config, datasetState.status, settingsState.status, diagnosticsReloadKey]);

  useEffect(() => {
    const onHashChange = () => setTabState(getInitialTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setTab = (next: TabId) => {
    setTabState(next);
    window.location.hash = `/${next}`;
  };

  const savePersistedSettings = async (settings: PersistedSettings): Promise<SettingsResponse> => {
    const response = await saveSettings(config, settings);
    setSettingsState({ status: "ready", response });
    return response;
  };

  const datasetReady = datasetState.status === "ready";
  const settingsReady = settingsState.status === "ready";
  const activeSettings = settingsReady ? settingsState.response.settings : DEFAULT_SETTINGS;

  return (
    <div className="yaxii-shipping-manager-app min-h-screen bg-background text-foreground">
      <Header
        pluginVersion={bootstrap.pluginVersion}
        onLaunchWizard={() => setWizardOpen(true)}
        launchDisabled={!datasetReady || !settingsReady}
      />
      <TopNav tab={tab} setTab={setTab} />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <RuntimeNotices
          bootstrap={bootstrap}
          datasetState={datasetState}
          settingsState={settingsState}
        />
        {tab === "zones" && (
          <ZonesScreen
            wilayas={wilayas}
            setWilayas={setWilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
          />
        )}
        {tab === "generator" && (
          <GeneratorHub
            onLaunch={() => setWizardOpen(true)}
            onOpenDiagnostics={() => setTab("diagnostics")}
            launchDisabled={!datasetReady || !settingsReady}
            latestPreview={latestPreview}
          />
        )}
        {tab === "diagnostics" && (
          <DiagnosticsScreen
            bootstrap={bootstrap}
            diagnosticsState={diagnosticsState}
            wilayas={wilayas}
            onRefresh={() => setDiagnosticsReloadKey((current) => current + 1)}
          />
        )}
        {tab === "import" && <ImportExportScreen />}
        {tab === "settings" && (
          <SettingsScreen settingsState={settingsState} onSave={savePersistedSettings} />
        )}
        {tab === "sync" && <SmartFormSyncScreen />}
      </main>
      <footer className="mx-auto max-w-5xl px-6 pb-10 text-center text-xs text-muted-foreground">
        Yaxii Shipping Manager - Local draft UI - No WooCommerce changes are made yet
      </footer>
      <div id="yaxii-shipping-manager-admin-portal" />

      {wizardOpen && (
        <GeneratorWizard
          config={config}
          settings={activeSettings}
          baseList={wilayasToReference(wilayas)}
          onClose={() => setWizardOpen(false)}
          onComplete={(next, defs) => {
            setWilayas(next);
            setMethodDefs(defs);
            setWizardOpen(false);
            setTab("generator");
          }}
          onPreviewReady={setLatestPreview}
          onOpenDiagnostics={() => {
            setWizardOpen(false);
            setTab("diagnostics");
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
  settingsState,
}: {
  bootstrap: BootstrapPayload;
  datasetState: DatasetLoadState;
  settingsState: SettingsLoadState;
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
          Settings, diagnostics, and preview are active. No WooCommerce changes are made; apply
          remains disabled.
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
      {settingsState.status === "loading" && (
        <Alert className="border-primary/20 bg-primary/5">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Loading saved settings</AlertTitle>
          <AlertDescription>
            Fetching the persisted plugin settings from WordPress.
          </AlertDescription>
        </Alert>
      )}
      {settingsState.status === "error" && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription>{settingsState.message}</AlertDescription>
        </Alert>
      )}
      {settingsState.status === "ready" && settingsState.response.warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Settings normalized</AlertTitle>
          <AlertDescription>{settingsState.response.warnings.join(" ")}</AlertDescription>
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
  onOpenDiagnostics,
  launchDisabled,
  latestPreview,
}: {
  onLaunch: () => void;
  onOpenDiagnostics: () => void;
  launchDisabled: boolean;
  latestPreview: PreviewResponse | null;
}) {
  return (
    <>
      <SectionHeader
        title="Generator"
        description="Prepare a local draft, then generate a read-only WooCommerce preview."
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
                ship with, then preview the WooCommerce changes before apply exists.
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <BulletItem>Current Algeria dataset</BulletItem>
                <BulletItem>Legacy 58-compatible mode is not available yet</BulletItem>
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
      {latestPreview && (
        <div className="mt-6">
          <PreviewPlanPanel response={latestPreview} onOpenDiagnostics={onOpenDiagnostics} />
        </div>
      )}
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
  config,
  settings,
  baseList,
  onClose,
  onComplete,
  onPreviewReady,
  onOpenDiagnostics,
}: {
  config: AdminBootstrapConfig;
  settings: PersistedSettings;
  baseList: WilayaReference[];
  onClose: () => void;
  onComplete: (wilayas: Wilaya[], defs: MethodDef[]) => void;
  onPreviewReady: (preview: PreviewResponse) => void;
  onOpenDiagnostics: () => void;
}) {
  const initialDraft = useMemo(() => generatorDraftFromSettings(settings), [settings]);
  const [step, setStep] = useState(0);
  const [setupPath, setSetupPathState] = useState<SetupPath>(initialDraft.setupPath);
  const [dataset, setDataset] = useState<DatasetMode>(initialDraft.datasetMode);
  const [labelFormat, setLabelFormat] = useState<RegionLabelFormat>(initialDraft.labelFormat);
  const [zoneNameFormat, setZoneNameFormat] = useState<ZoneNameFormat>(
    initialDraft.zoneNaming.format,
  );
  const [zonePrefix, setZonePrefix] = useState(initialDraft.zoneNaming.prefix);
  const [officeWordingMode, setOfficeWordingMode] = useState<OfficeMethodWording>(
    initialDraft.officeWordingMode,
  );
  const [officeCustomLabel, setOfficeCustomLabel] = useState(settings.officeCustomLabel);
  const [methods, setMethods] = useState<ShippingMethodTemplate[]>(initialDraft.methods);
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
              officeWordingMode={officeWordingMode}
              setOfficeWordingMode={setOfficeWordingMode}
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
              selectedCodes={selectedCodes}
              config={config}
              onPreviewReady={onPreviewReady}
              onOpenDiagnostics={onOpenDiagnostics}
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
            This wizard prepares a local draft and read-only preview only.
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
        Each path prepares a local draft and a read-only preview. No WooCommerce changes are made.
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
        These choices affect the local draft and the read-only preview plan.
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
  officeWordingMode,
  setOfficeWordingMode,
  officeCustomLabel,
  setOfficeCustomLabel,
}: {
  methods: ShippingMethodTemplate[];
  setMethods: Dispatch<SetStateAction<ShippingMethodTemplate[]>>;
  officeWordingMode: OfficeMethodWording;
  setOfficeWordingMode: (wording: OfficeMethodWording) => void;
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
    setOfficeWordingMode(wording);
    updateMethod("office_delivery", { label: officeLabelForWording(wording, officeCustomLabel) });
  };

  const updateOfficeCustomLabel = (label: string) => {
    setOfficeCustomLabel(label);
    if (officeWordingMode === "custom") {
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
              value={officeWordingMode}
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
          {officeWordingMode === "custom" && (
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
  const [priceError, setPriceError] = useState("");

  const setDefaultPrice = (key: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice === undefined) {
      setPriceError("Prices must be empty, zero, or higher.");
      return;
    }

    setPriceError("");
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
      {priceError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid price</AlertTitle>
          <AlertDescription>{priceError}</AlertDescription>
        </Alert>
      )}
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
  selectedCodes,
  config,
  onPreviewReady,
  onOpenDiagnostics,
}: {
  setupPath: SetupPath;
  baseList: WilayaReference[];
  methods: ShippingMethodTemplate[];
  dataset: DatasetMode;
  labelFormat: RegionLabelFormat;
  zoneNameFormat: ZoneNameFormat;
  zonePrefix: string;
  selectedWilayaCount: number;
  selectedCodes: string[];
  config: AdminBootstrapConfig;
  onPreviewReady: (preview: PreviewResponse) => void;
  onOpenDiagnostics: () => void;
}) {
  const [previewState, setPreviewState] = useState<PreviewLoadState>({ status: "idle" });
  const selectedWilayas = baseList.filter((wilaya) => selectedCodes.includes(wilaya.code));
  const sampleWilaya = baseList[0] ?? { code: "16", name: "Alger", ar: "الجزائر" };
  const enabledMethods = methods.filter((method) => method.enabled);
  const pricedMethods = enabledMethods.filter((method) => method.defaultPrice !== null).length;
  const pricingRows = selectedWilayas.map((wilaya) => ({
    wilayaCode: wilaya.code,
    enabled: true,
    methods: Object.fromEntries(
      enabledMethods.map((method) => [method.key, method.defaultPrice]),
    ) as Partial<Record<ShippingMethodKey, number | null>>,
  }));
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
  const previewRequest: PreviewRequest = {
    selectedWilayaCodes: selectedCodes,
    pricingRows,
    methods,
    zoneNameFormat,
    zonePrefix,
    regionLabelFormat: labelFormat,
  };

  const loadPreview = async () => {
    setPreviewState({ status: "loading" });

    try {
      const response = await fetchPreview(config, previewRequest);
      setPreviewState({ status: "ready", response });
      onPreviewReady(response);
    } catch (error) {
      setPreviewState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to generate preview.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Review draft</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This is a preview only. No WooCommerce changes were made.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Apply engine is not enabled yet. Yaxii will only apply reviewed plans in a later step.
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
          <CardDescription>
            The preview planner reads WooCommerce diagnostics and returns a dry-run plan.
          </CardDescription>
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
            <span>Apply status</span>
            <Badge variant="secondary">Apply engine is not enabled yet</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Locked safety rules</span>
            <Badge variant="outline">{SAFETY_RULES.length}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected wilayas</CardTitle>
            <CardDescription>
              These wilayas are sent to the read-only preview planner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWilayas.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No wilayas selected</AlertTitle>
                <AlertDescription>
                  Select at least one wilaya to create a useful preview.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedWilayas.slice(0, 12).map((wilaya) => (
                  <Badge key={wilaya.code} variant="outline">
                    {wilaya.code} -{" "}
                    {formatRegionLabel({ nameFr: wilaya.name, nameAr: wilaya.ar }, labelFormat)}
                  </Badge>
                ))}
                {selectedWilayas.length > 12 && (
                  <Badge variant="secondary">+{selectedWilayas.length - 12} more</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Method prices</CardTitle>
            <CardDescription>
              These default prices are included in the preview request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {enabledMethods.map((method) => (
              <div key={method.key} className="flex items-center justify-between gap-3">
                <span>{method.label}</span>
                <Badge variant={method.defaultPrice === null ? "secondary" : "outline"}>
                  {method.defaultPrice === null ? "Unset" : `${method.defaultPrice} DZD`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={loadPreview}
          disabled={previewState.status === "loading" || selectedWilayaCount === 0}
        >
          <Activity className="h-4 w-4" />
          {previewState.status === "loading" ? "Generating preview..." : "Preview changes"}
        </Button>
        <Button disabled variant="outline">
          <Lock className="h-4 w-4" />
          Apply engine comes next.
        </Button>
      </div>

      {previewState.status === "error" && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview could not be generated</AlertTitle>
          <AlertDescription>{previewState.message}</AlertDescription>
        </Alert>
      )}

      {previewState.status === "ready" && (
        <PreviewPlanPanel response={previewState.response} onOpenDiagnostics={onOpenDiagnostics} />
      )}
    </div>
  );
}

type PreviewLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: PreviewResponse }
  | { status: "error"; message: string };

function PreviewPlanPanel({
  response,
  onOpenDiagnostics,
}: {
  response: PreviewResponse;
  onOpenDiagnostics: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>This is a preview only. No WooCommerce changes were made.</AlertTitle>
        <AlertDescription>{response.summary.recommendedAction}</AlertDescription>
      </Alert>

      <ApplyReadinessPanel readiness={response.applyReadiness} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apply confirmation contract</CardTitle>
          <CardDescription>
            Apply will be enabled after the safe apply engine is implemented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Preview reference</span>
            <Badge variant="outline">{response.previewHash.slice(0, 12)}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Preview generated</span>
            <Badge variant="secondary">{response.previewGeneratedAt}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Contract version</span>
            <Badge variant="outline">{response.applyContractVersion}</Badge>
          </div>
          <Button disabled variant="outline" className="mt-2">
            <Lock className="h-4 w-4" />
            Apply disabled
          </Button>
          <Button variant="outline" className="mt-2" onClick={onOpenDiagnostics}>
            <Activity className="h-4 w-4" />
            Open diagnostics
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStat label="Zones to create" value={String(response.summary.createZones)} />
        <PreviewStat label="Methods to add" value={String(response.summary.addMethods)} />
        <PreviewStat label="Conflicts" value={String(response.summary.conflicts)} tone="warn" />
        <PreviewStat label="Manual skips" value={String(response.summary.skipManualZones)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview plan</CardTitle>
          <CardDescription>{response.canApplyLaterMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreviewPlanGroup
            title="Zones to create"
            emptyLabel="No new zones proposed."
            items={response.plan.createZones}
          />
          <PreviewPlanGroup
            title="Zones to update"
            emptyLabel="No zone updates proposed."
            items={response.plan.updateZones}
          />
          <PreviewPlanGroup
            title="Methods to add"
            emptyLabel="No method additions proposed."
            items={response.plan.addMethods}
          />
          <PreviewPlanGroup
            title="Methods to update"
            emptyLabel="No method updates proposed."
            items={response.plan.updateMethods}
          />
          <PreviewPlanGroup
            title="Manual zones skipped"
            emptyLabel="No manual zones skipped."
            items={response.plan.skipManualZones}
          />
          <PreviewPlanGroup
            title="Conflicts"
            emptyLabel="No conflicts found."
            items={response.plan.conflicts}
          />
          <PreviewPlanGroup
            title="Warnings"
            emptyLabel="No warnings returned."
            items={response.plan.warnings}
          />
          <PreviewPlanGroup
            title="Unchanged"
            emptyLabel="No unchanged wilayas in this preview."
            items={response.plan.unchanged}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ApplyReadinessPanel({ readiness }: { readiness: ApplyReadiness }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{readiness.title}</CardTitle>
          <Badge variant={applyReadinessBadgeVariant(readiness.severity)}>
            {applyReadinessSeverityLabel(readiness.severity)}
          </Badge>
        </div>
        <CardDescription>{readiness.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-muted-foreground">{readiness.recommendedAction}</div>
        {readiness.blockingReasons.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <div className="font-medium text-destructive">Blocking reasons</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
              {readiness.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <ReadinessCount label="Creates" value={readiness.counts.creates} />
          <ReadinessCount label="Updates" value={readiness.counts.updates} />
          <ReadinessCount label="Manual skips" value={readiness.counts.manualSkips} />
          <ReadinessCount label="Conflicts" value={readiness.counts.conflicts} />
          <ReadinessCount label="Method adds" value={readiness.counts.methodAdditions} />
          <ReadinessCount label="Method updates" value={readiness.counts.methodUpdates} />
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function applyReadinessBadgeVariant(severity: ApplyReadiness["severity"]) {
  if (severity === "blocked") {
    return "destructive";
  }

  return severity === "ready" ? "outline" : "secondary";
}

function applyReadinessSeverityLabel(severity: ApplyReadiness["severity"]): string {
  if (severity === "blocked") {
    return "Blocked";
  }

  return severity === "ready" ? "Ready later" : "Needs review";
}

function PreviewPlanGroup({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: PreviewPlanItem[];
}) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2 p-4">
        {items.length === 0 && <div className="text-sm text-muted-foreground">{emptyLabel}</div>}
        {items.map((item, index) => (
          <PreviewPlanRow
            key={`${item.type}-${item.wilayaCode ?? index}-${item.zoneId ?? index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewPlanRow({ item }: { item: PreviewPlanItem }) {
  const title = item.message ?? item.zoneName ?? item.label ?? item.wilayaName ?? item.type;
  const details = previewItemDetails(item);

  return (
    <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {item.wilayaCode && <Badge variant="outline">{item.wilayaCode}</Badge>}
        {item.ownershipSource && (
          <Badge variant={item.ownershipSource === "manual_unknown" ? "secondary" : "outline"}>
            {ownershipSourceLabel(item.ownershipSource)}
          </Badge>
        )}
        <span className="font-medium">{title}</span>
      </div>
      {details && <div className="mt-1 text-xs text-muted-foreground">{details}</div>}
    </div>
  );
}

function previewItemDetails(item: PreviewPlanItem): string {
  const details = [
    item.reason,
    item.location ? `Location ${item.location}` : "",
    item.zoneId ? `Zone ID ${item.zoneId}` : "",
    item.methodKey ? `Method ${item.methodKey}` : "",
    item.price !== undefined && item.price !== null ? `Price ${item.price} DZD` : "",
    item.zoneNames && item.zoneNames.length > 0 ? `Zones: ${item.zoneNames.join(", ")}` : "",
    item.ownershipSources && item.ownershipSources.length > 0
      ? `Ownership: ${item.ownershipSources.map(ownershipSourceLabel).join(", ")}`
      : "",
  ];

  return details.filter(Boolean).join(" - ");
}

function ownershipSourceLabel(source: PreviewPlanItem["ownershipSource"]): string {
  if (source === "managed_registry") {
    return "Yaxii managed";
  }

  if (source === "yaxii_name_hint") {
    return "Yaxii-looking";
  }

  return "Manual/unknown";
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
        min={0}
        value={method.price ?? ""}
        onChange={(event) => {
          const nextPrice = parseOptionalPrice(event.target.value);
          if (nextPrice !== undefined) {
            onChange({ price: nextPrice });
          }
        }}
        className="h-8"
      />
    </div>
  );
}

function DiagnosticsScreen({
  bootstrap,
  diagnosticsState,
  wilayas,
  onRefresh,
}: {
  bootstrap: BootstrapPayload;
  diagnosticsState: DiagnosticsLoadState;
  wilayas: Wilaya[];
  onRefresh: () => void;
}) {
  const [sim, setSim] = useState<string | null>(null);
  const simulatedWilaya = sim ? wilayas.find((wilaya) => wilaya.code === sim) : undefined;

  return (
    <>
      <SectionHeader
        title="Checkout Protection"
        description="Read-only WooCommerce diagnostics inspect existing zones and shipping methods."
        action={
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={diagnosticsState.status === "loading"}
          >
            <RefreshCw
              className={cn("h-4 w-4", diagnosticsState.status === "loading" && "animate-spin")}
            />
            Refresh diagnostics
          </Button>
        }
      />

      <StateRegistrationCard bootstrap={bootstrap} />

      {(diagnosticsState.status === "waiting" || diagnosticsState.status === "loading") && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading read-only WooCommerce diagnostics...
          </CardContent>
        </Card>
      )}

      {diagnosticsState.status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Diagnostics could not be loaded</AlertTitle>
          <AlertDescription>{diagnosticsState.message}</AlertDescription>
        </Alert>
      )}

      {diagnosticsState.status === "ready" && !diagnosticsState.response.woocommerceActive && (
        <Alert>
          <PowerOff className="h-4 w-4" />
          <AlertTitle>WooCommerce is inactive</AlertTitle>
          <AlertDescription>
            Activate WooCommerce to inspect shipping zones. No shipping configuration was changed.
          </AlertDescription>
        </Alert>
      )}

      {diagnosticsState.status === "ready" && diagnosticsState.response.woocommerceActive && (
        <>
          {diagnosticsState.response.warnings.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Read-only diagnostic warning</AlertTitle>
              <AlertDescription>{diagnosticsState.response.warnings[0]}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <SummaryStat
              label="Configured wilayas"
              value={diagnosticsState.response.summary.configuredWilayas}
              tone="ok"
            />
            <SummaryStat
              label="Missing wilayas"
              value={diagnosticsState.response.summary.missingWilayas}
              tone={diagnosticsState.response.summary.missingWilayas > 0 ? "warn" : "ok"}
            />
            <SummaryStat
              label="Conflicts"
              value={diagnosticsState.response.summary.duplicateConflictCount}
              tone={diagnosticsState.response.summary.duplicateConflictCount > 0 ? "fail" : "ok"}
            />
            <SummaryStat
              label="Zones without methods"
              value={diagnosticsState.response.summary.zonesWithoutMethods}
              tone={diagnosticsState.response.summary.zonesWithoutMethods > 0 ? "warn" : "ok"}
            />
            <SummaryStat
              label="Fallback risk"
              value={fallbackRiskLabel(diagnosticsState.response.summary.checkoutFallbackRisk)}
              tone={fallbackRiskTone(diagnosticsState.response.summary.checkoutFallbackRisk)}
            />
            <SummaryStat
              label="Rest-of-world methods"
              value={diagnosticsState.response.summary.restOfWorldHasMethods ? "Yes" : "No"}
              tone={diagnosticsState.response.summary.restOfWorldHasMethods ? "ok" : "warn"}
            />
          </div>

          <Alert className="mb-6">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Recommended next action</AlertTitle>
            <AlertDescription>
              {diagnosticsState.response.summary.recommendedNextAction}
            </AlertDescription>
          </Alert>

          <WilayaDiagnosticsTable response={diagnosticsState.response} />
          <ZoneDiagnosticsPanel zones={diagnosticsState.response.zoneResults} />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> Local draft method simulator
              </CardTitle>
              <CardDescription>
                Pick a wilaya to inspect local draft methods. This does not read or write checkout.
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
              {simulatedWilaya && <CheckoutSim wilaya={simulatedWilaya} />}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function StateRegistrationCard({ bootstrap }: { bootstrap: BootstrapPayload }) {
  const active = bootstrap.wooStatesStatus.active;

  return (
    <Card className="mb-4">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            active
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {active ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {active
              ? "Algeria wilayas are registered in WooCommerce."
              : "Algeria wilayas are not registered in WooCommerce."}
          </div>
          <div className="text-xs text-muted-foreground">
            {bootstrap.wooStatesStatus.wilayaCount} wilayas loaded from the current dataset.
          </div>
          <div className="text-xs text-muted-foreground">
            Legacy 58-compatible mode is not available yet.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
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

function WilayaDiagnosticsTable({ response }: { response: DiagnosticsResponse }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Wilaya coverage</CardTitle>
        <CardDescription>
          Status is based on existing WooCommerce zone locations matched to DZ state codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matched zones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {response.wilayaResults.map((wilaya) => (
              <TableRow key={wilaya.code}>
                <TableCell className="font-mono text-xs">{wilaya.code}</TableCell>
                <TableCell>
                  <div className="font-medium">{wilaya.nameFr}</div>
                  <div className="text-xs text-muted-foreground">{wilaya.nameAr}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={wilaya.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {wilaya.zoneNames.length > 0 ? wilaya.zoneNames.join(", ") : "None"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ZoneDiagnosticsPanel({ zones }: { zones: ZoneDiagnostic[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Existing WooCommerce zones</CardTitle>
        <CardDescription>
          Manual zones are not treated as errors. Yaxii-looking names are weak hints only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {zones.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No WooCommerce shipping zones were returned.
          </div>
        )}
        {zones.map((zone) => (
          <div key={zone.zoneId} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{zone.name}</div>
                <div className="text-xs text-muted-foreground">Zone ID {zone.zoneId}</div>
              </div>
              <Badge variant={zone.ownershipHint === "yaxii_hint" ? "default" : "secondary"}>
                {zone.ownershipHint === "yaxii_hint" ? "Yaxii-looking" : "Manual or unknown"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div>Matched wilayas: {zone.matchedWilayaCodes.length}</div>
              <div>Overlapping wilayas: {zone.overlapWilayaCodes.length}</div>
              <div>
                Methods: {zone.enabledMethodCount}/{zone.methodCount} enabled
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {zone.methodCount === 0 && <Badge variant="outline">No methods</Badge>}
              {zone.disabledMethods > 0 && <Badge variant="outline">Disabled methods</Badge>}
              {zone.hasHomeLikeMethod && <Badge variant="outline">Home-like method</Badge>}
              {zone.hasOfficeLikeMethod && <Badge variant="outline">Office-like method</Badge>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: WilayaDiagnosticStatus }) {
  const label =
    status === "configured" ? "Configured" : status === "missing" ? "Missing" : "Conflict";
  const variant =
    status === "configured" ? "default" : status === "missing" ? "secondary" : "destructive";

  return <Badge variant={variant}>{label}</Badge>;
}

function fallbackRiskLabel(risk: CheckoutFallbackRisk): string {
  return risk === "low" ? "Low" : risk === "medium" ? "Medium" : "High";
}

function fallbackRiskTone(risk: CheckoutFallbackRisk): "ok" | "warn" | "fail" {
  if (risk === "low") {
    return "ok";
  }

  return risk === "medium" ? "warn" : "fail";
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

function SettingsScreen({
  settingsState,
  onSave,
}: {
  settingsState: SettingsLoadState;
  onSave: (settings: PersistedSettings) => Promise<SettingsResponse>;
}) {
  if (settingsState.status === "loading") {
    return (
      <>
        <SectionHeader
          title="Settings"
          description="Loading saved plugin settings from WordPress."
        />
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            Loading settings...
          </CardContent>
        </Card>
      </>
    );
  }

  if (settingsState.status === "error") {
    return (
      <>
        <SectionHeader title="Settings" description="Saved settings could not be loaded." />
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription>{settingsState.message}</AlertDescription>
        </Alert>
      </>
    );
  }

  return <SettingsForm response={settingsState.response} onSave={onSave} />;
}

function SettingsForm({
  response,
  onSave,
}: {
  response: SettingsResponse;
  onSave: (settings: PersistedSettings) => Promise<SettingsResponse>;
}) {
  const [draft, setDraft] = useState<PersistedSettings>(response.settings);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    setDraft(response.settings);
  }, [response.settings]);

  const updateDraft = (patch: Partial<PersistedSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaveState("idle");
  };

  const updateMethod = (
    key: ShippingMethodKey,
    patch: Partial<Pick<ShippingMethodTemplate, "enabled" | "label" | "defaultPrice">>,
  ) => {
    updateDraft({
      methods: draft.methods.map((method) =>
        method.key === key ? { ...method, ...patch } : method,
      ),
    });
  };

  const updateOfficeWording = (wording: OfficeMethodWording) => {
    updateDraft({ officeWordingMode: wording });
    updateMethod("office_delivery", {
      label: officeLabelForWording(wording, draft.officeCustomLabel),
    });
  };

  const updateOfficeCustomLabel = (label: string) => {
    updateDraft({ officeCustomLabel: label });
    if (draft.officeWordingMode === "custom") {
      updateMethod("office_delivery", { label: officeLabelForWording("custom", label) });
    }
  };

  const updateDefaultPrice = (key: ShippingMethodKey, rawValue: string) => {
    const nextPrice = parseOptionalPrice(rawValue);
    if (nextPrice !== undefined) {
      updateMethod(key, { defaultPrice: nextPrice });
      return;
    }

    setSaveState("error");
    setSaveMessage("Prices must be empty, zero, or higher.");
  };

  const saveDraft = async (settings: PersistedSettings) => {
    setSaveState("saving");
    setSaveMessage("");

    try {
      const savedResponse = await onSave(settings);
      setDraft(savedResponse.settings);
      setSaveState("saved");
      setSaveMessage(
        savedResponse.warnings.length ? savedResponse.warnings.join(" ") : "Settings saved.",
      );
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Settings could not be saved.");
    }
  };

  return (
    <>
      <SectionHeader
        title="Settings"
        description="Persisted plugin settings. WooCommerce zones are not read or written here."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => saveDraft(response.defaults)}
              disabled={saveState === "saving"}
            >
              Reset to defaults
            </Button>
            <Button onClick={() => saveDraft(draft)} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Saving..." : "Save settings"}
            </Button>
          </div>
        }
      />
      {saveState === "saved" && (
        <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Settings saved</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}
      {saveState === "error" && (
        <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="space-y-6 p-6">
          <SettingRow label="Dataset mode" desc="Legacy mapping is not available yet.">
            <Select
              value={draft.datasetMode}
              onValueChange={(value) => {
                const option = DATASET_MODE_OPTIONS.find((entry) => entry.mode === value);
                if (option?.available) {
                  updateDraft({ datasetMode: option.mode });
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
              value={draft.regionLabelFormat}
              onValueChange={(value) =>
                updateDraft({ regionLabelFormat: value as RegionLabelFormat })
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
              value={draft.zoneNameFormat}
              onValueChange={(value) => updateDraft({ zoneNameFormat: value as ZoneNameFormat })}
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
              value={draft.zonePrefix}
              onChange={(event) => updateDraft({ zonePrefix: event.target.value })}
              className="w-44"
            />
          </SettingRow>
          <Separator />
          <SettingRow label="Office method wording" desc="Controls the office_delivery label.">
            <Select
              value={draft.officeWordingMode}
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
          {draft.officeWordingMode === "custom" && (
            <SettingRow label="Office custom label" desc="Local draft label only.">
              <Input
                value={draft.officeCustomLabel}
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
          {draft.methods.map((method) => (
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
