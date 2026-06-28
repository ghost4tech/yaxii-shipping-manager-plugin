import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  Lock,
  Package,
  Percent,
  Power,
  PowerOff,
  RefreshCw,
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
  WilayaStatus,
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
            wilayas={wilayas}
            setWilayas={setWilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
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
      <Alert className="border-primary/20 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Preview before apply</AlertTitle>
        <AlertDescription>
          Settings, diagnostics, and preview are active. Apply can create missing managed zones, add
          missing methods, and update Yaxii-managed method prices after confirmation.
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
    const price = parseOptionalPrice(bulkPrice);
    if (price === undefined || bulkPrice.trim() === "") {
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
          price: 0,
        };
        return {
          ...wilaya,
          methods: { ...wilaya.methods, [targetMethod]: { ...method, price: 0, enabled: true } },
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
        description="Manage wilaya shipping prices in a local draft. Use the generator preview/apply flow for supported WooCommerce writes."
        action={
          <Button variant="outline" onClick={onLaunchWizard}>
            <Wand2 className="h-4 w-4" /> Open generator
          </Button>
        }
      />

      <Alert className="mb-4 border-primary/20 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Local draft controls only</AlertTitle>
        <AlertDescription>
          Price, free shipping, enabled, and disabled controls on this screen update only the local
          draft. Use the generator preview/apply flow for supported WooCommerce writes.
        </AlertDescription>
      </Alert>

      {hasSelection && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">{selected.length} selected</Badge>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-xs text-muted-foreground">Draft method:</span>
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
                type="text"
                placeholder="Price or free"
                value={bulkPrice}
                onChange={(event) => setBulkPrice(event.target.value)}
                className="h-8 w-24"
              />
              <Button size="sm" variant="outline" onClick={previewBulkPrice} disabled={!bulkPrice}>
                <DollarSign className="h-4 w-4" /> Apply draft price
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
                <Percent className="h-4 w-4" /> Preview draft %
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={makeFree}>
              Mark free in draft
            </Button>
            <Button size="sm" variant="outline" onClick={disableMethod}>
              <PowerOff className="h-4 w-4" /> Disable in draft
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
              <Power className="h-4 w-4" /> Enable draft rows
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setWilayaEnabled(false);
                setConfirmOpen(true);
              }}
            >
              <PowerOff className="h-4 w-4" /> Disable draft rows
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
        title="Update local draft only?"
        description={
          pending
            ? `${selected.length} row(s) will be updated in the local draft. No WooCommerce zones are changed.`
            : "No local draft changes to preview."
        }
        confirmLabel="Update draft only"
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
        Add draft method
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
        <PowerOff className="h-3 w-3" /> Draft off
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
      {(method.price === null || method.price === 0) && (
        <Badge variant="outline" className="border-emerald-200 text-[10px] text-emerald-700">
          Free draft
        </Badge>
      )}
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
