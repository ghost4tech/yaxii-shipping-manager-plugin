import { Fragment, type ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  ExternalLink,
  Lock,
  Package,
  PowerOff,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
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
  DEFAULT_SETTINGS,
  DEFAULT_SHIPPING_METHOD_TEMPLATES,
  OFFICE_METHOD_WORDING_OPTIONS,
  REGION_LABEL_FORMAT_OPTIONS,
  SAFETY_RULES,
  ZONE_NAMING_OPTIONS,
  officeLabelForWording,
} from "../data/default-settings";
import type { WilayaDatasetRecord } from "../types/dataset";
import type {
  CheckoutFallbackRisk,
  DiagnosticsResponse,
  WilayaDiagnosticStatus,
  ZoneDiagnostic,
} from "../types/diagnostics";
import type { ShippingMethodKey, ShippingMethodTemplate } from "../types/generator";
import type { PreviewRequest, PreviewResponse } from "../types/preview";
import type {
  OfficeMethodWording,
  PersistedSettings,
  RegionLabelFormat,
  SettingsResponse,
  ZoneNameFormat,
} from "../types/settings";
import { GeneratorWizard } from "@/components/generator/GeneratorWizard";
import { PreviewPlanPanel } from "@/components/generator/PreviewPlanPanel";
import type {
  GeneratorPreviewSnapshot,
  Method,
  MethodDef,
  Wilaya,
  WilayaReference,
} from "@/components/generator/types";
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
import { enabledMethodDefs } from "@/lib/generator/methods";
import { parseOptionalPrice } from "@/lib/generator/pricing";
import { cn } from "@/lib/utils";

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
  const [latestPreview, setLatestPreview] = useState<GeneratorPreviewSnapshot | null>(null);

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

  const openAndRefreshDiagnostics = () => {
    setDiagnosticsReloadKey((current) => current + 1);
    setTab("diagnostics");
  };

  const closeWizardAndOpenDiagnostics = (refresh = false) => {
    if (refresh) {
      setDiagnosticsReloadKey((current) => current + 1);
    }
    setTab("diagnostics");
    setWizardOpen(false);
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
            config={config}
            wilayas={wilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
            diagnosticsState={diagnosticsState}
            onOpenDiagnostics={() => setTab("diagnostics")}
            onRefreshDiagnostics={() => setDiagnosticsReloadKey((current) => current + 1)}
            onPreviewReady={(response, context, request) =>
              setLatestPreview({ response, context, request })
            }
          />
        )}
        {tab === "generator" && (
          <GeneratorHub
            config={config}
            onLaunch={() => setWizardOpen(true)}
            onOpenDiagnostics={() => setTab("diagnostics")}
            onRefreshDiagnostics={openAndRefreshDiagnostics}
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
        Yaxii Shipping Manager - Preview first - Manual zones are protected
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
          onPreviewReady={(response, context, request) =>
            setLatestPreview({ response, context, request })
          }
          onOpenDiagnostics={() => closeWizardAndOpenDiagnostics()}
          onRefreshDiagnostics={() => closeWizardAndOpenDiagnostics(true)}
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
            The admin UI can load, but WooCommerce-specific diagnostics and apply actions remain
            unavailable.
          </AlertDescription>
        </Alert>
      )}
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
  config,
  onLaunch,
  onOpenDiagnostics,
  onRefreshDiagnostics,
  launchDisabled,
  latestPreview,
}: {
  config: AdminBootstrapConfig;
  onLaunch: () => void;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  launchDisabled: boolean;
  latestPreview: GeneratorPreviewSnapshot | null;
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
                ship with, then preview supported WooCommerce changes before applying them.
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <BulletItem>Current Algeria dataset</BulletItem>
                <BulletItem>Legacy 58-compatible mode is not available yet</BulletItem>
                <BulletItem>CSV import path prepared, backend not connected yet</BulletItem>
                <BulletItem>
                  Apply can create zones, add methods, and update Yaxii-managed prices
                </BulletItem>
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
          <PreviewPlanPanel
            response={latestPreview.response}
            context={latestPreview.context}
            config={config}
            previewRequest={latestPreview.request}
            onOpenDiagnostics={onOpenDiagnostics}
            onRefreshDiagnostics={onRefreshDiagnostics}
            onDone={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
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

type LiveZoneStatus =
  | "managed"
  | "ready"
  | "needs_methods"
  | "needs_update"
  | "missing"
  | "manual"
  | "conflict"
  | "checking"
  | "unavailable";

type LiveZoneSummary = {
  status: LiveZoneStatus;
  message: string;
  zones: ZoneDiagnostic[];
};

type PendingPriceMap = Record<string, Partial<Record<string, number | null>>>;
type ZoneFilter = "all" | "active" | "needs_update" | "missing" | "manual_conflict" | "pending";
type ZoneTableRow = {
  wilaya: Wilaya;
  liveZone: LiveZoneSummary;
  pendingMethodCount: number;
};
type ZoneReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      response: PreviewResponse;
      context: GeneratorPreviewSnapshot["context"];
      request: PreviewRequest;
    }
  | { status: "error"; message: string };

const LIVE_STATUS_META: Record<LiveZoneStatus, { label: string; dot: string; pill: string }> = {
  managed: {
    label: "Active",
    dot: "bg-emerald-500",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  ready: {
    label: "Not managed",
    dot: "bg-primary",
    pill: "border-primary/20 bg-primary/5 text-primary",
  },
  needs_methods: {
    label: "Missing setup",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  needs_update: {
    label: "Needs update",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  missing: {
    label: "Missing setup",
    dot: "bg-amber-500",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  manual: {
    label: "Protected",
    dot: "bg-slate-400",
    pill: "border-slate-200 bg-slate-50 text-slate-700",
  },
  conflict: {
    label: "Manual conflict",
    dot: "bg-red-500",
    pill: "border-red-200 bg-red-50 text-red-700",
  },
  checking: {
    label: "Checking",
    dot: "bg-slate-400",
    pill: "border-slate-200 bg-slate-50 text-slate-700",
  },
  unavailable: {
    label: "Unavailable",
    dot: "bg-slate-400",
    pill: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

function LiveStatusPill({ status }: { status: LiveZoneStatus }) {
  const meta = LIVE_STATUS_META[status];
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
  config,
  wilayas,
  methodDefs,
  onLaunchWizard,
  diagnosticsState,
  onOpenDiagnostics,
  onRefreshDiagnostics,
  onPreviewReady,
}: {
  config: AdminBootstrapConfig;
  wilayas: Wilaya[];
  methodDefs: MethodDef[];
  onLaunchWizard: () => void;
  diagnosticsState: DiagnosticsLoadState;
  onOpenDiagnostics: () => void;
  onRefreshDiagnostics: () => void;
  onPreviewReady: (
    preview: PreviewResponse,
    context: GeneratorPreviewSnapshot["context"],
    request: PreviewRequest,
  ) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [targetMethod, setTargetMethod] = useState<string>(methodDefs[0]?.key ?? "home_delivery");
  const [bulkPrice, setBulkPriceInput] = useState("");
  const [pendingPrices, setPendingPrices] = useState<PendingPriceMap>({});
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewState, setReviewState] = useState<ZoneReviewState>({ status: "idle" });
  const liveSummary = shippingSetupSummary(diagnosticsState);
  const pendingCount = pendingPriceCount(pendingPrices);

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
              <Wand2 className="h-4 w-4" /> Open Generator
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const rows: ZoneTableRow[] = wilayas.map((wilaya) => ({
    wilaya,
    liveZone: liveStatusForWilaya(wilaya, diagnosticsState, methodDefs),
    pendingMethodCount: Object.keys(pendingPrices[wilaya.code] ?? {}).length,
  }));
  const visibleRows = rows.filter(
    (row) =>
      rowMatchesZoneFilter(row, zoneFilter) && rowMatchesSearchQuery(row.wilaya, searchQuery),
  );
  const visibleCodes = visibleRows.map((row) => row.wilaya.code);
  const hasSelection = selected.length > 0;
  const allVisibleSelected =
    visibleCodes.length > 0 && visibleCodes.every((code) => selected.includes(code));
  const stats = shippingZoneManagerStats(rows, methodDefs, pendingCount);
  const toggleAll = (value: boolean) =>
    setSelected((current) =>
      value
        ? Array.from(new Set([...current, ...visibleCodes]))
        : current.filter((code) => !visibleCodes.includes(code)),
    );
  const toggleWilayaSelection = (code: string, value: boolean) =>
    setSelected((current) =>
      value ? Array.from(new Set([...current, code])) : current.filter((item) => item !== code),
    );
  const selectedManagedCodes = selected.filter((code) => {
    const row = rows.find((item) => item.wilaya.code === code);
    return row ? canEditManagedMethod(row.liveZone, targetMethod) : false;
  });
  const protectedSelectionCount = selected.length - selectedManagedCodes.length;

  const updatePendingPrice = (
    wilaya: Wilaya,
    liveZone: LiveZoneSummary,
    methodKey: string,
    price: number | null,
  ) => {
    const livePrice = livePriceForKey(liveZone, methodKey);
    setPendingPrices((current) =>
      withPendingPrice(current, wilaya.code, methodKey, livePrice === price ? undefined : price),
    );
    setReviewState({ status: "idle" });
  };

  const clearPendingChanges = () => {
    setPendingPrices({});
    setReviewState({ status: "idle" });
  };

  const applyBulkPrice = () => {
    const price = parseOptionalPrice(bulkPrice);
    if (price === undefined || bulkPrice.trim() === "") {
      return;
    }

    setBulkPendingPrice(price);
    setBulkPriceInput("");
  };

  const setBulkPendingPrice = (price: number | null) => {
    setPendingPrices((current) => {
      let next = current;
      selectedManagedCodes.forEach((code) => {
        const wilaya = wilayas.find((row) => row.code === code);
        if (!wilaya) {
          return;
        }
        const liveZone = liveStatusForWilaya(wilaya, diagnosticsState, methodDefs);
        next = withPendingPrice(
          next,
          code,
          targetMethod,
          livePriceForKey(liveZone, targetMethod) === price ? undefined : price,
        );
      });
      return next;
    });
    setReviewState({ status: "idle" });
  };

  const reviewPendingChanges = async () => {
    const request = previewRequestFromPendingChanges(
      wilayas,
      methodDefs,
      diagnosticsState,
      pendingPrices,
    );
    if (!request) {
      setReviewState({ status: "error", message: "No supported pending changes to review." });
      return;
    }

    setReviewState({ status: "loading" });
    try {
      const response = await fetchPreview(config, request);
      const context = previewContextForPendingChanges(request, methodDefs, pendingPrices);
      setReviewState({ status: "ready", response, context, request });
      onPreviewReady(response, context, request);
    } catch (error) {
      setReviewState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to review pending changes.",
      });
    }
  };

  const closeReviewPanel = () => {
    clearPendingChanges();
    onRefreshDiagnostics();
  };

  return (
    <>
      <SectionHeader
        title="Shipping Zones"
        description="Live WooCommerce status, protected manual zones, and supported price changes in one place."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Live from WooCommerce
                </Badge>
                <div>
                  <div className="text-xl font-semibold text-foreground">{liveSummary.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {liveSummary.message}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ManagerMetric label="Active wilayas" value={stats.activeWilayas} />
                  <ManagerMetric label="Managed methods" value={stats.managedMethods} />
                  <ManagerMetric
                    label="Pending changes"
                    value={stats.pendingChanges}
                    tone="pending"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button onClick={onLaunchWizard}>
                  <Wand2 className="h-4 w-4" />
                  Open Generator
                </Button>
                <Button variant="outline" onClick={onOpenDiagnostics}>
                  <Activity className="h-4 w-4" /> Diagnostics
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.open(
                      "admin.php?page=wc-settings&tab=shipping",
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  <ExternalLink className="h-4 w-4" /> WooCommerce zones
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Safe price management</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Price edits become pending changes. Yaxii reviews them again before WooCommerce is
                  updated.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Manual zones are protected.
              </div>
              <div className="flex items-center gap-2">
                <PowerOff className="h-3.5 w-3.5" />
                Enable/disable controls are coming later.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasSelection && (
        <Card className="mt-4 border-primary/15">
          <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
            <div className="flex items-center gap-3">
              <Badge className="rounded-full">{selected.length} selected</Badge>
              <div className="text-sm text-muted-foreground">
                Bulk changes are prepared as pending prices.
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
              <Select value={targetMethod} onValueChange={setTargetMethod}>
                <SelectTrigger className="h-9 w-44">
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
              <Input
                type="text"
                placeholder="Price"
                value={bulkPrice}
                onChange={(event) => setBulkPriceInput(event.target.value)}
                className="h-9 w-24"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={applyBulkPrice}
                disabled={!bulkPrice || selectedManagedCodes.length === 0}
              >
                <DollarSign className="h-4 w-4" /> Set price
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkPendingPrice(0)}
                disabled={selectedManagedCodes.length === 0}
              >
                Free shipping
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                <X className="h-4 w-4" /> Clear selection
              </Button>
            </div>
            {protectedSelectionCount > 0 && (
              <div className="text-xs text-muted-foreground xl:basis-full">
                {protectedSelectionCount} selected row(s) are protected or not managed. Use
                WooCommerce for manual methods.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="text-base">Wilaya shipping prices</CardTitle>
              <CardDescription>
                Edit Yaxii-managed Home and Office prices. Nothing changes in WooCommerce until
                review.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search wilaya or code"
                  className="h-9 w-full pl-9 sm:w-64"
                />
              </div>
              <Badge variant="outline" className="justify-center rounded-full">
                {pendingCount > 0 ? `${pendingCount} pending` : "No pending changes"}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {zoneFilterOptions(rows).map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={zoneFilter === option.value ? "default" : "outline"}
                onClick={() => setZoneFilter(option.value)}
                className="shrink-0"
              >
                {option.label}
                <span className="ml-1 text-xs opacity-75">{option.count}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-card">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(value) => toggleAll(Boolean(value))}
                />
              </TableHead>
              <TableHead className="min-w-56">Wilaya</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="min-w-56">{methodDefs[0]?.label ?? "Home delivery"}</TableHead>
              <TableHead className="min-w-56">
                {methodDefs[1]?.label ?? "Office delivery"}
              </TableHead>
              <TableHead className="w-28 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map(({ wilaya, liveZone, pendingMethodCount }) => {
              const isSelected = selected.includes(wilaya.code);
              const detailsVisible = Boolean(detailsOpen[wilaya.code]);
              return (
                <Fragment key={wilaya.code}>
                  <TableRow
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      isSelected && "bg-primary/5",
                      pendingMethodCount > 0 && "border-l-4 border-l-amber-400",
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(value) =>
                          toggleWilayaSelection(wilaya.code, Boolean(value))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-mono text-xs text-muted-foreground">
                          {wilaya.code}
                        </div>
                        <div>
                          <div className="font-medium">{wilaya.name}</div>
                          <div className="text-xs text-muted-foreground">{wilaya.ar}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <LiveStatusPill status={liveZone.status} />
                      {pendingMethodCount > 0 && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                          >
                            Pending change
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    {methodDefs.slice(0, 2).map((method) => (
                      <TableCell key={method.key}>
                        <MethodCell
                          wilaya={wilaya}
                          methodDef={method}
                          liveZone={liveZone}
                          pendingPrice={pendingPrices[wilaya.code]?.[method.key]}
                          onChange={(price) =>
                            updatePendingPrice(wilaya, liveZone, method.key, price)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDetailsOpen((current) => ({
                            ...current,
                            [wilaya.code]: !detailsVisible,
                          }))
                        }
                      >
                        {detailsVisible ? "Hide" : "Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {detailsVisible && (
                    <TableRow key={`${wilaya.code}-details`} className="bg-muted/20">
                      <TableCell />
                      <TableCell colSpan={5}>
                        <LiveZoneDetails summary={liveZone} methodDefs={methodDefs} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm font-medium">No wilayas match this view</div>
                    <p className="max-w-md text-sm text-muted-foreground">
                      Try another search or filter. Protected manual zones and missing setup are
                      still visible when diagnostics report them.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {pendingCount > 0 && (
        <div className="sticky bottom-4 z-20 mt-4 rounded-xl border border-primary/20 bg-card p-4 shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">Review before applying</div>
              <p className="text-sm text-muted-foreground">
                {pendingCount} pending change(s). Changes will be reviewed before WooCommerce is
                updated.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={reviewPendingChanges} disabled={reviewState.status === "loading"}>
                {reviewState.status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
                Review changes
              </Button>
              <Button variant="outline" onClick={clearPendingChanges}>
                Clear changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {reviewState.status === "loading" && (
        <Card className="mt-4">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Reviewing pending changes...
          </CardContent>
        </Card>
      )}
      {reviewState.status === "error" && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Review could not be created</AlertTitle>
          <AlertDescription>{reviewState.message}</AlertDescription>
        </Alert>
      )}
      {reviewState.status === "ready" && (
        <PreviewPlanPanel
          response={reviewState.response}
          context={reviewState.context}
          config={config}
          previewRequest={reviewState.request}
          onOpenDiagnostics={onOpenDiagnostics}
          onRefreshDiagnostics={onRefreshDiagnostics}
          onRefreshPreview={reviewPendingChanges}
          onDone={closeReviewPanel}
        />
      )}
    </>
  );
}

function ManagerMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "pending";
}) {
  return (
    <div className="rounded-lg border border-border bg-background/80 p-3">
      <div
        className={cn(
          "text-xl font-semibold",
          tone === "pending" && value > 0 ? "text-amber-600" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function shippingZoneManagerStats(
  rows: ZoneTableRow[],
  methodDefs: MethodDef[],
  pendingChanges: number,
): {
  activeWilayas: number;
  managedMethods: number;
  pendingChanges: number;
} {
  return {
    activeWilayas: rows.filter((row) => row.liveZone.status === "managed").length,
    managedMethods: rows.reduce(
      (total, row) =>
        total +
        methodDefs
          .slice(0, 2)
          .filter((methodDef) => canEditManagedMethod(row.liveZone, methodDef.key)).length,
      0,
    ),
    pendingChanges,
  };
}

function zoneFilterOptions(rows: ZoneTableRow[]): Array<{
  value: ZoneFilter;
  label: string;
  count: number;
}> {
  return [
    { value: "all", label: "All", count: rows.length },
    {
      value: "active",
      label: "Active",
      count: rows.filter((row) => row.liveZone.status === "managed").length,
    },
    {
      value: "needs_update",
      label: "Needs update",
      count: rows.filter((row) => row.pendingMethodCount > 0).length,
    },
    {
      value: "missing",
      label: "Missing setup",
      count: rows.filter((row) =>
        ["missing", "needs_methods", "unavailable"].includes(row.liveZone.status),
      ).length,
    },
    {
      value: "manual_conflict",
      label: "Manual conflict",
      count: rows.filter((row) => ["manual", "conflict"].includes(row.liveZone.status)).length,
    },
    {
      value: "pending",
      label: "Pending changes",
      count: rows.filter((row) => row.pendingMethodCount > 0).length,
    },
  ];
}

function rowMatchesZoneFilter(row: ZoneTableRow, zoneFilter: ZoneFilter): boolean {
  if (zoneFilter === "all") {
    return true;
  }

  if (zoneFilter === "active") {
    return row.liveZone.status === "managed";
  }

  if (zoneFilter === "needs_update" || zoneFilter === "pending") {
    return row.pendingMethodCount > 0;
  }

  if (zoneFilter === "missing") {
    return ["missing", "needs_methods", "unavailable"].includes(row.liveZone.status);
  }

  return ["manual", "conflict"].includes(row.liveZone.status);
}

function rowMatchesSearchQuery(wilaya: Wilaya, searchQuery: string): boolean {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return [wilaya.code, wilaya.name, wilaya.ar].some((value) => value.toLowerCase().includes(query));
}

function pendingPriceCount(pendingPrices: PendingPriceMap): number {
  return Object.values(pendingPrices).reduce(
    (total, methodPrices) => total + Object.keys(methodPrices).length,
    0,
  );
}

function pendingWilayaCodes(pendingPrices: PendingPriceMap): string[] {
  return Object.entries(pendingPrices)
    .filter(([, methodPrices]) => Object.keys(methodPrices).length > 0)
    .map(([wilayaCode]) => wilayaCode);
}

function withPendingPrice(
  pendingPrices: PendingPriceMap,
  wilayaCode: string,
  methodKey: string,
  pendingPrice: number | null | undefined,
): PendingPriceMap {
  const nextRow = { ...(pendingPrices[wilayaCode] ?? {}) };
  if (pendingPrice === undefined) {
    delete nextRow[methodKey];
  } else {
    nextRow[methodKey] = pendingPrice;
  }

  const nextPrices = { ...pendingPrices };
  if (Object.keys(nextRow).length === 0) {
    delete nextPrices[wilayaCode];
  } else {
    nextPrices[wilayaCode] = nextRow;
  }

  return nextPrices;
}

function canEditManagedMethod(liveZone: LiveZoneSummary, methodKey: string): boolean {
  return liveZone.zones.some(
    (zone) =>
      zone.ownershipHint === "managed_registry" && Boolean(liveMethodForKey(zone, methodKey)),
  );
}

function livePriceForKey(liveZone: LiveZoneSummary, methodKey: string): number | null {
  for (const zone of liveZone.zones) {
    if (zone.ownershipHint !== "managed_registry") {
      continue;
    }
    const method = liveMethodForKey(zone, methodKey);
    if (method) {
      return priceNumberFromCost(method.cost);
    }
  }

  return null;
}

function priceNumberFromCost(cost: string | null): number | null {
  if (cost === null || cost.trim() === "") {
    return null;
  }

  const price = Number(cost);
  return Number.isFinite(price) ? price : null;
}

function previewRequestFromPendingChanges(
  wilayas: Wilaya[],
  methodDefs: MethodDef[],
  diagnosticsState: DiagnosticsLoadState,
  pendingPrices: PendingPriceMap,
): PreviewRequest | null {
  if (diagnosticsState.status !== "ready") {
    return null;
  }

  const changedCodes = pendingWilayaCodes(pendingPrices);
  if (changedCodes.length === 0) {
    return null;
  }

  const selectedWilayas = wilayas.filter((wilaya) => changedCodes.includes(wilaya.code));
  return {
    selectedWilayaCodes: selectedWilayas.map((wilaya) => wilaya.code),
    methods: methodTemplatesFromDefs(methodDefs),
    pricingRows: selectedWilayas.map((wilaya) => {
      const liveZone = liveStatusForWilaya(wilaya, diagnosticsState, methodDefs);
      return {
        wilayaCode: wilaya.code,
        enabled: true,
        methods: Object.fromEntries(
          methodDefs.map((methodDef) => [
            methodDef.key,
            pendingPrices[wilaya.code]?.[methodDef.key] ?? livePriceForKey(liveZone, methodDef.key),
          ]),
        ) as Partial<Record<ShippingMethodKey, number | null>>,
      };
    }),
  };
}

function methodTemplatesFromDefs(methodDefs: MethodDef[]): ShippingMethodTemplate[] {
  return methodDefs.map((methodDef) => ({
    key: methodDef.key as ShippingMethodKey,
    enabled: true,
    label: methodDef.label,
    defaultPrice: methodDef.defaultPrice,
    type: "flat_rate",
    locked: methodDef.locked,
  }));
}

function previewContextForPendingChanges(
  request: PreviewRequest,
  methodDefs: MethodDef[],
  pendingPrices: PendingPriceMap,
): GeneratorPreviewSnapshot["context"] {
  return {
    selectedWilayaCount: request.selectedWilayaCodes?.length ?? 0,
    communeCoverageSummary: "Wilaya-level WooCommerce shipping zones.",
    enabledMethodLabels: methodDefs.map((method) => method.label),
    priceSummary: `${pendingPriceCount(pendingPrices)} pending price change(s)`,
  };
}

function MethodCell({
  wilaya,
  methodDef,
  liveZone,
  pendingPrice,
  onChange,
}: {
  wilaya: Wilaya;
  methodDef: MethodDef;
  liveZone: LiveZoneSummary;
  pendingPrice?: number | null;
  onChange: (price: number | null) => void;
}) {
  const canEdit = canEditManagedMethod(liveZone, methodDef.key);
  const livePrice = livePriceForKey(liveZone, methodDef.key);
  const inputPrice = pendingPrice !== undefined ? pendingPrice : livePrice;
  const changed = pendingPrice !== undefined;
  const isFree = inputPrice === 0;

  if (!canEdit) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {formatLiveCost(livePrice === null ? null : String(livePrice))}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {liveZone.status === "manual" || liveZone.status === "conflict"
              ? "Protected"
              : "Not available"}
          </Badge>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Manual or missing methods cannot be changed here.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 transition-colors",
        changed ? "border-amber-300 bg-amber-50/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          placeholder="Unset"
          value={inputPrice ?? ""}
          onChange={(event) => {
            if (event.target.value.trim() === "") {
              onChange(livePrice);
              return;
            }
            const nextPrice = parseOptionalPrice(event.target.value);
            if (nextPrice !== undefined) {
              onChange(nextPrice);
            }
          }}
          aria-label={`${wilaya.name} ${methodDef.label} pending price`}
          className="h-9 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <span className="text-xs font-medium text-muted-foreground">DZD</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Live from WooCommerce: {formatLiveCost(livePrice === null ? null : String(livePrice))}
        </span>
        {changed && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
          >
            Pending change
          </Badge>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-md bg-muted/45 px-2 py-1.5">
        <span className="text-xs text-muted-foreground">
          {isFree ? "Free shipping" : "Paid shipping"}
        </span>
        <Switch
          checked={isFree}
          onCheckedChange={(checked) =>
            onChange(checked ? 0 : nextPaidPrice(livePrice, methodDef.defaultPrice))
          }
          aria-label={`${wilaya.name} ${methodDef.label} free shipping`}
        />
      </div>
    </div>
  );
}

function nextPaidPrice(
  livePrice: number | null,
  defaultPrice: number | null | undefined,
): number | null {
  if (livePrice !== 0 && livePrice !== null) {
    return livePrice;
  }

  return defaultPrice ?? null;
}

function shippingSetupSummary(diagnosticsState: DiagnosticsLoadState): {
  title: string;
  message: string;
} {
  if (diagnosticsState.status === "waiting" || diagnosticsState.status === "loading") {
    return {
      title: "Checking shipping setup",
      message: "Yaxii is reading WooCommerce zones and methods before showing live status.",
    };
  }

  if (diagnosticsState.status === "error") {
    return {
      title: "Shipping status needs refresh",
      message: diagnosticsState.message,
    };
  }

  if (!diagnosticsState.response.woocommerceActive) {
    return {
      title: "WooCommerce is inactive",
      message: "Activate WooCommerce to inspect live shipping zones and methods.",
    };
  }

  const summary = diagnosticsState.response.summary;
  if (summary.duplicateConflictCount > 0) {
    return {
      title: "Manual zones need review",
      message:
        "Conflicting or overlapping WooCommerce zones were found. Check diagnostics before applying changes.",
    };
  }

  if (summary.missingWilayas > 0 || summary.zonesWithoutMethods > 0) {
    return {
      title: "Some shipping setup is missing",
      message:
        "Use Generator preview/apply to create missing Yaxii-managed setup where it is safe.",
    };
  }

  const directZones = diagnosticsState.response.zoneResults.filter(
    (zone) => zone.matchedWilayaCodes.length > 0,
  );
  const allDirectZonesManaged =
    directZones.length > 0 &&
    directZones.every((zone) => zone.ownershipHint === "managed_registry");

  return {
    title: "Shipping setup is active",
    message: allDirectZonesManaged
      ? "All selected wilayas have Yaxii-managed methods and prices."
      : "WooCommerce checkout has matching zones and methods. Review ownership before applying updates.",
  };
}

function liveStatusForWilaya(
  wilaya: Wilaya,
  diagnosticsState: DiagnosticsLoadState,
  methodDefs: MethodDef[],
): LiveZoneSummary {
  if (diagnosticsState.status === "waiting" || diagnosticsState.status === "loading") {
    return { status: "checking", message: "Reading WooCommerce", zones: [] };
  }

  if (diagnosticsState.status === "error") {
    return { status: "unavailable", message: "Diagnostics unavailable", zones: [] };
  }

  if (!diagnosticsState.response.woocommerceActive) {
    return { status: "unavailable", message: "WooCommerce inactive", zones: [] };
  }

  const result = diagnosticsState.response.wilayaResults.find((item) => item.code === wilaya.code);
  const zones = result
    ? diagnosticsState.response.zoneResults.filter((zone) => result.zoneIds.includes(zone.zoneId))
    : [];

  if (!result || result.status === "missing") {
    return { status: "missing", message: "Setup missing", zones };
  }

  if (result.status === "conflict") {
    const hasManualZone = zones.some((zone) => zone.ownershipHint === "manual_unknown");
    return {
      status: "conflict",
      message: hasManualZone ? "Manual conflict protected" : "Duplicate zones found",
      zones,
    };
  }

  const [zone] = zones;
  if (!zone) {
    return { status: "unavailable", message: "Zone details unavailable", zones };
  }

  if (zone.ownershipHint === "manual_unknown") {
    return { status: "manual", message: "Protected manual zone", zones };
  }

  if (zone.enabledMethodCount === 0 || !zone.hasHomeLikeMethod || !zone.hasOfficeLikeMethod) {
    return { status: "needs_methods", message: "Methods missing", zones };
  }

  if (
    zone.ownershipHint === "managed_registry" &&
    hasDraftPriceDifference(wilaya, zone, methodDefs)
  ) {
    return { status: "needs_update", message: "Pending price change", zones };
  }

  if (zone.ownershipHint === "managed_registry") {
    return { status: "managed", message: "Managed by Yaxii", zones };
  }

  return { status: "ready", message: "Name match only", zones };
}

function hasDraftPriceDifference(
  wilaya: Wilaya,
  zone: ZoneDiagnostic,
  methodDefs: MethodDef[],
): boolean {
  return methodDefs.some((methodDef) => {
    const draftMethod = wilaya.methods[methodDef.key];
    const liveMethod = liveMethodForKey(zone, methodDef.key);
    if (!draftMethod || !liveMethod || !draftMethod.enabled) {
      return false;
    }

    return normalizedPrice(draftMethod.price) !== normalizedPrice(liveMethod.cost);
  });
}

function LiveZoneDetails({
  summary,
  methodDefs,
}: {
  summary: LiveZoneSummary;
  methodDefs: MethodDef[];
}) {
  if (summary.zones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
        No WooCommerce zone is currently matched to this wilaya.
      </div>
    );
  }

  return (
    <div className="grid gap-3 py-3 md:grid-cols-2">
      {summary.zones.map((zone) => (
        <div key={zone.zoneId} className="rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">{zone.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Live from WooCommerce</div>
            </div>
            <OwnershipBadge ownershipHint={zone.ownershipHint} />
          </div>
          <div className="mt-4 grid gap-2">
            {methodDefs.slice(0, 2).map((methodDef) => {
              const method = liveMethodForKey(zone, methodDef.key);
              return (
                <div
                  key={methodDef.key}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <span>{methodDef.label}</span>
                  <span className="font-medium">
                    {method ? formatLiveCost(method.cost) : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnershipBadge({ ownershipHint }: { ownershipHint: ZoneDiagnostic["ownershipHint"] }) {
  if (ownershipHint === "managed_registry") {
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Managed by Yaxii
      </Badge>
    );
  }

  if (ownershipHint === "manual_unknown") {
    return <Badge variant="secondary">Manual zone protected</Badge>;
  }

  return <Badge variant="outline">Name match only</Badge>;
}

function liveMethodForKey(zone: ZoneDiagnostic, methodKey: string) {
  const registryMethod = zone.managedMethods.find((method) => method.methodKey === methodKey);
  if (registryMethod) {
    return zone.methods.find((method) => method.instanceId === registryMethod.instanceId);
  }

  return undefined;
}

function formatLiveCost(cost: string | null): string {
  if (cost === null || cost.trim() === "") {
    return "price not set";
  }

  return normalizedPrice(cost) === "0" ? "Free" : `${cost} DZD`;
}

function normalizedPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : String(value);
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
              <Badge
                variant={
                  zone.ownershipHint === "managed_registry"
                    ? "default"
                    : zone.ownershipHint === "yaxii_hint"
                      ? "outline"
                      : "secondary"
                }
              >
                {zone.ownershipHint === "managed_registry"
                  ? "Yaxii-managed"
                  : zone.ownershipHint === "yaxii_hint"
                    ? "Yaxii-looking"
                    : "Manual or unknown"}
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
                  {method.price === null || method.price === 0 ? "Free" : `${method.price} DZD`}
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
              desc="Required safety rule for the safe apply engine."
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
