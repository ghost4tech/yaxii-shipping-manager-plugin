import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Wand2,
} from "lucide-react";

import type { AdminBootstrapConfig, BootstrapPayload } from "../bootstrap";
import { fetchDatasetWilayas } from "../api/dataset-api";
import { fetchDiagnostics } from "../api/diagnostics-api";
import { fetchManagedSetupRemovalPreview, removeManagedSetup } from "../api/managed-setup-api";
import { fetchSettings, saveSettings } from "../api/settings-api";
import {
  DEFAULT_SETTINGS,
  DEFAULT_SHIPPING_METHOD_TEMPLATES,
  REGION_LABEL_FORMAT_OPTIONS,
} from "../data/default-settings";
import type { WilayaDatasetRecord } from "../types/dataset";
import type { DiagnosticsResponse } from "../types/diagnostics";
import type { ManagedSetupRemovalPreview, ManagedSetupRemovalResult } from "../types/managed-setup";
import type { PersistedSettings, RegionLabelFormat, SettingsResponse } from "../types/settings";
import { GeneratorWizard } from "@/components/generator/GeneratorWizard";
import { PreviewPlanPanel } from "@/components/generator/PreviewPlanPanel";
import { ShippingZonesPage } from "@/components/shipping-zones/ShippingZonesPage";
import type {
  GeneratorPreviewSnapshot,
  Method,
  MethodDef,
  Wilaya,
  WilayaReference,
} from "@/components/generator/types";
import { DiagnosticsPage } from "@/components/diagnostics/DiagnosticsPage";
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
import { enabledMethodDefs } from "@/lib/generator/methods";
import { cn } from "@/lib/utils";

const DEFAULT_METHOD_DEFS: MethodDef[] = enabledMethodDefs(DEFAULT_SHIPPING_METHOD_TEMPLATES);
const APP_CONTAINER_CLASS = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";

const TABS = [
  { id: "zones", label: "Shipping Editor", icon: Package },
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "settings", label: "Settings", icon: SettingsIcon },
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
type RemovalPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: ManagedSetupRemovalPreview }
  | { status: "error"; message: string };
type RemovalResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; response: ManagedSetupRemovalResult }
  | { status: "error"; message: string };

const VISIBLE_REMOVAL_CONFIRMATION = "REMOVE";

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
    if (settingsState.status !== "ready") {
      return;
    }

    let cancelled = false;
    const datasetMode = settingsState.response.settings.datasetMode;
    setDatasetState({ status: "loading" });

    async function loadDataset() {
      try {
        const response = await fetchDatasetWilayas(config, datasetMode);
        if (!cancelled) {
          setDatasetState({
            status: "ready",
            metadataVersion: response.metadata.version ?? `${datasetMode}-dataset`,
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
  }, [config, settingsState]);

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
      <main className={cn(APP_CONTAINER_CLASS, "pb-32 pt-8")}>
        <RuntimeNotices
          bootstrap={bootstrap}
          datasetState={datasetState}
          settingsState={settingsState}
        />
        {tab === "zones" && (
          <ShippingZonesPage
            config={config}
            wilayas={wilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
            diagnosticsState={diagnosticsState}
            woocommerceSettingsUrl={bootstrap.adminUrls.woocommerceSettings}
            onOpenDiagnostics={() => setTab("diagnostics")}
            onRefreshDiagnostics={() => setDiagnosticsReloadKey((current) => current + 1)}
            onPreviewReady={(response, context, request) =>
              setLatestPreview({ response, context, request })
            }
          />
        )}
        {tab === "generator" && (
          <GeneratorHub
            onLaunch={() => setWizardOpen(true)}
            launchDisabled={!datasetReady || !settingsReady}
            latestPreview={latestPreview}
          />
        )}
        {tab === "diagnostics" && (
          <DiagnosticsPage
            diagnosticsState={diagnosticsState}
            onRefresh={() => setDiagnosticsReloadKey((current) => current + 1)}
            onOpenShippingZones={() => setTab("zones")}
            onOpenGenerator={() => setTab("generator")}
            onOpenWooCommerceZones={() =>
              window.open(bootstrap.adminUrls.woocommerceSettings, "_blank", "noopener,noreferrer")
            }
          />
        )}
        {tab === "settings" && (
          <SettingsScreen
            settingsState={settingsState}
            config={config}
            onSave={savePersistedSettings}
            onLaunchWizard={() => setWizardOpen(true)}
            onRefreshDiagnostics={() => setDiagnosticsReloadKey((current) => current + 1)}
          />
        )}
      </main>
      <footer
        className={cn(APP_CONTAINER_CLASS, "pb-10 text-center text-xs text-muted-foreground")}
      >
        Yaxii Shipping Manager - Preview first - Manual zones are protected
      </footer>
      <div id="yaxii-shipping-manager-admin-portal" />

      {wizardOpen && (
        <GeneratorWizard
          config={config}
          settings={activeSettings}
          baseList={wilayasToReference(wilayas)}
          diagnostics={diagnosticsState.status === "ready" ? diagnosticsState.response : undefined}
          onClose={() => setWizardOpen(false)}
          onComplete={(next, defs) => {
            setWilayas(next);
            setMethodDefs(defs);
            setDiagnosticsReloadKey((current) => current + 1);
            setWizardOpen(false);
            setTab("zones");
          }}
          onPreviewReady={(response, context, request) =>
            setLatestPreview({ response, context, request })
          }
          onOpenDiagnostics={() => closeWizardAndOpenDiagnostics()}
          onOpenShippingZones={() => {
            setWizardOpen(false);
            setTab("zones");
          }}
          onOpenWooCommerceZones={() =>
            window.open(bootstrap.adminUrls.woocommerceSettings, "_blank", "noopener,noreferrer")
          }
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
          <AlertDescription>
            Fetching wilayas from the selected local REST dataset.
          </AlertDescription>
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
      <div className={cn(APP_CONTAINER_CLASS, "flex flex-wrap items-center gap-4 py-8")}>
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
      <div className={cn(APP_CONTAINER_CLASS, "flex gap-1 overflow-x-auto overflow-y-hidden py-1")}>
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
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
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function GeneratorHub({
  onLaunch,
  launchDisabled,
  latestPreview,
}: {
  onLaunch: () => void;
  launchDisabled: boolean;
  latestPreview: GeneratorPreviewSnapshot | null;
}) {
  return (
    <>
      <SectionHeader
        title="Generator"
        description="Create or repair Yaxii-managed shipping setup safely."
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
                Choose current or legacy coverage, define shipping methods and prices, then preview
                supported WooCommerce changes before generating setup.
              </p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <BulletItem>Current Algeria dataset</BulletItem>
                <BulletItem>Legacy 58-compatible dataset</BulletItem>
                <BulletItem>Preview-only mode for support review</BulletItem>
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
          <PreviewPlanPanel response={latestPreview.response} context={latestPreview.context} />
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

function SettingsScreen({
  settingsState,
  config,
  onSave,
  onLaunchWizard,
  onRefreshDiagnostics,
}: {
  settingsState: SettingsLoadState;
  config: AdminBootstrapConfig;
  onSave: (settings: PersistedSettings) => Promise<SettingsResponse>;
  onLaunchWizard: () => void;
  onRefreshDiagnostics: () => void;
}) {
  if (settingsState.status === "loading") {
    return (
      <>
        <SectionHeader title="Settings" description="Loading saved defaults from WordPress." />
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
        <SectionHeader title="Settings" description="Saved defaults could not be loaded." />
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Settings unavailable</AlertTitle>
          <AlertDescription>{settingsState.message}</AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <SettingsForm
      response={settingsState.response}
      config={config}
      onSave={onSave}
      onLaunchWizard={onLaunchWizard}
      onRefreshDiagnostics={onRefreshDiagnostics}
    />
  );
}

function SettingsForm({
  response,
  config,
  onSave,
  onLaunchWizard,
  onRefreshDiagnostics,
}: {
  response: SettingsResponse;
  config: AdminBootstrapConfig;
  onSave: (settings: PersistedSettings) => Promise<SettingsResponse>;
  onLaunchWizard: () => void;
  onRefreshDiagnostics: () => void;
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

  const saveDraft = async (settings: PersistedSettings) => {
    setSaveState("saving");
    setSaveMessage("");

    try {
      const savedResponse = await onSave(settings);
      setDraft(savedResponse.settings);
      setSaveState("saved");
      setSaveMessage(
        "Settings saved. Existing WooCommerce shipping zones and prices were not changed.",
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
        description="Manage global preferences and advanced setup tools."
        action={
          <Button onClick={() => saveDraft(draft)} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving..." : "Save settings"}
          </Button>
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
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingRow
              label="Wilaya display language"
              desc="Used for Algeria wilaya labels in WooCommerce and as the default for new Generator drafts."
            >
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Safety rules are always on</CardTitle>
            <CardDescription>
              Yaxii protects manual WooCommerce zones, requires preview before apply, skips
              conflicts by default, and never deletes manual zones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These rules cannot be disabled in this release.
            </p>
          </CardContent>
        </Card>
      </div>
      <AdvancedToolsCard
        config={config}
        onLaunchWizard={onLaunchWizard}
        onRefreshDiagnostics={onRefreshDiagnostics}
      />
    </>
  );
}

function AdvancedToolsCard({
  config,
  onLaunchWizard,
  onRefreshDiagnostics,
}: {
  config: AdminBootstrapConfig;
  onLaunchWizard: () => void;
  onRefreshDiagnostics: () => void;
}) {
  const [previewState, setPreviewState] = useState<RemovalPreviewState>({ status: "idle" });
  const [removeState, setRemoveState] = useState<RemovalResultState>({ status: "idle" });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const previewRemoval = useCallback(
    async (preserveResult = false) => {
      setPreviewState({ status: "loading" });
      if (!preserveResult) {
        setRemoveState({ status: "idle" });
      }
      setConfirmationText("");

      try {
        const response = await fetchManagedSetupRemovalPreview(config);
        setPreviewState({ status: "ready", response });
        return response;
      } catch (error) {
        setPreviewState({
          status: "error",
          message: error instanceof Error ? error.message : "Removal preview could not be loaded.",
        });
        return null;
      }
    },
    [config],
  );

  useEffect(() => {
    void previewRemoval(true);
  }, [previewRemoval]);

  const executeRemoval = async (preview: ManagedSetupRemovalPreview) => {
    setRemoveState({ status: "loading" });

    try {
      const response = await removeManagedSetup(config, {
        confirmed: true,
        confirmationText: preview.requiredConfirmationText,
        dryRunHash: preview.dryRunHash,
        dryRunGeneratedAt: preview.dryRunGeneratedAt,
        acceptedSummary: preview.acceptedSummary,
      });
      setRemoveState({ status: "ready", response });
      setConfirmationText("");
      await previewRemoval(true);
      onRefreshDiagnostics();
    } catch (error) {
      setRemoveState({
        status: "error",
        message: error instanceof Error ? error.message : "Managed setup removal failed.",
      });
    }
  };
  const openRemovalModal = () => {
    setModalOpen(true);
    void previewRemoval(true);
  };
  const openGenerator = () => {
    setModalOpen(false);
    onLaunchWizard();
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Advanced tools</CardTitle>
        <CardDescription>
          Support tools for inspecting Yaxii-managed WooCommerce setup safely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 rounded-md border border-dashed border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium">Remove Yaxii setup</div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Remove only Yaxii-managed WooCommerce zones and methods. Manual WooCommerce zones will
              not be touched.
            </p>
          </div>
          <RemovalToolAction
            previewState={previewState}
            onOpenModal={openRemovalModal}
            onRetry={() => previewRemoval(true)}
          />
        </div>
        {previewState.status === "error" && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Removal status unavailable</AlertTitle>
            <AlertDescription>{previewState.message}</AlertDescription>
          </Alert>
        )}
        {removeState.status === "ready" && (
          <RemovalSuccessCard response={removeState.response} onLaunchWizard={openGenerator} />
        )}
        <RemovalConfirmationDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          previewState={previewState}
          removeState={removeState}
          confirmationText={confirmationText}
          onConfirmationTextChange={setConfirmationText}
          onConfirm={() => {
            if (previewState.status === "ready") {
              void executeRemoval(previewState.response);
            }
          }}
          onLaunchWizard={openGenerator}
        />
      </CardContent>
    </Card>
  );
}

function RemovalToolAction({
  previewState,
  onOpenModal,
  onRetry,
}: {
  previewState: RemovalPreviewState;
  onOpenModal: () => void;
  onRetry: () => void;
}) {
  if (previewState.status === "idle" || previewState.status === "loading") {
    return (
      <Button disabled>
        {previewState.status === "loading" ? "Checking..." : "Check removal status"}
      </Button>
    );
  }

  if (previewState.status === "error") {
    return (
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    );
  }

  if (!removalWorkAvailable(previewState.response)) {
    return <div className="text-sm font-medium text-muted-foreground">No Yaxii setup found.</div>;
  }

  return (
    <Button type="button" variant="destructive" onClick={onOpenModal}>
      Remove Yaxii setup
    </Button>
  );
}

function RemovalConfirmationDialog({
  open,
  onOpenChange,
  previewState,
  removeState,
  confirmationText,
  onConfirmationTextChange,
  onConfirm,
  onLaunchWizard,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  previewState: RemovalPreviewState;
  removeState: RemovalResultState;
  confirmationText: string;
  onConfirmationTextChange: (value: string) => void;
  onConfirm: () => void;
  onLaunchWizard: () => void;
}) {
  const preview = previewState.status === "ready" ? previewState.response : null;
  const canConfirm =
    preview !== null &&
    removalWorkAvailable(preview) &&
    !removalHasBlockers(preview) &&
    confirmationText === VISIBLE_REMOVAL_CONFIRMATION &&
    removeState.status !== "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Remove Yaxii setup?</DialogTitle>
          <DialogDescription>
            This removes only Yaxii-managed WooCommerce shipping zones and methods. Manual
            WooCommerce zones will not be touched.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can generate a new Yaxii setup again later.
          </p>
          {(previewState.status === "idle" || previewState.status === "loading") && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking Yaxii setup...
            </div>
          )}
          {previewState.status === "error" && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Removal status unavailable</AlertTitle>
              <AlertDescription>{previewState.message}</AlertDescription>
            </Alert>
          )}
          {preview && !removalWorkAvailable(preview) && (
            <Alert className="border-slate-200 bg-slate-50 text-slate-900">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>No Yaxii setup found.</AlertTitle>
              <AlertDescription>There are no Yaxii-managed zones to remove.</AlertDescription>
            </Alert>
          )}
          {preview && removalWorkAvailable(preview) && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <RemovalPreviewMetric
                  label="Yaxii-managed zones to remove"
                  value={removableZoneCount(preview)}
                />
                <RemovalPreviewMetric
                  label="Manual zones protected"
                  value={preview.manualProtectedZoneCount}
                />
                <RemovalPreviewMetric
                  label="Warnings/blockers"
                  value={removalWarningCount(preview)}
                />
              </div>
              {removalHasBlockers(preview) ? (
                <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Yaxii setup cannot be safely removed yet.</AlertTitle>
                  <AlertDescription>
                    Open technical details for the exact blockers.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium" htmlFor="yaxii-removal-confirmation">
                    Type REMOVE to confirm
                  </label>
                  <Input
                    id="yaxii-removal-confirmation"
                    value={confirmationText}
                    onChange={(event) => onConfirmationTextChange(event.target.value)}
                    placeholder={VISIBLE_REMOVAL_CONFIRMATION}
                    className="bg-background"
                  />
                </div>
              )}
              <RemovalTechnicalDetails response={preview} />
            </>
          )}
          {removeState.status === "error" && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Removal failed</AlertTitle>
              <AlertDescription>{removeState.message}</AlertDescription>
            </Alert>
          )}
          {removeState.status === "ready" && (
            <RemovalSuccessCard response={removeState.response} onLaunchWizard={onLaunchWizard} />
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {preview && removalWorkAvailable(preview) && !removalHasBlockers(preview) && (
            <Button type="button" variant="destructive" onClick={onConfirm} disabled={!canConfirm}>
              {removeState.status === "loading" ? "Removing..." : "Confirm removal"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemovalTechnicalDetails({ response }: { response: ManagedSetupRemovalPreview }) {
  return (
    <details className="rounded-md border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">View technical details</summary>
      <div className="mt-3 space-y-3">
        {response.registryWarnings.length > 0 && (
          <RemovalPreviewList
            title="Warnings"
            empty="No warnings."
            rows={response.registryWarnings}
          />
        )}
        {removalHasBlockers(response) && (
          <RemovalPreviewList
            title="Blockers"
            empty="No blockers."
            rows={[
              ...response.blockingReasons,
              ...response.blockedZones.flatMap((zone) =>
                zone.blockingReasons.map(
                  (reason) => `#${zone.zoneId} - ${zone.zoneName}: ${reason}`,
                ),
              ),
            ]}
          />
        )}
        <RemovalPreviewList
          title="Yaxii-managed zones"
          empty="No Yaxii-managed zones were found."
          rows={response.zonesToRemoveLater.map(
            (zone) =>
              `#${zone.zoneId} - ${zone.zoneName} (${zone.wilayaCode}) - ${
                zone.canRemove ? "can remove" : "blocked"
              }`,
          )}
        />
        <RemovalPreviewList
          title="Yaxii-managed methods"
          empty="No Yaxii-managed methods were found."
          rows={response.methodsToRemoveLater.map(
            (method) => `#${method.instanceId} - ${method.title} in zone #${method.zoneId}`,
          )}
        />
        <RemovalPreviewList
          title="Manual zones protected"
          empty="No manual WooCommerce zones were found."
          rows={response.manualZonesProtected.map(
            (zone) => `#${zone.zoneId} - ${zone.zoneName} (${zone.methodCount} methods)`,
          )}
        />
      </div>
    </details>
  );
}

function RemovalSuccessCard({
  response,
  onLaunchWizard,
}: {
  response: ManagedSetupRemovalResult;
  onLaunchWizard: () => void;
}) {
  return (
    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
      <ShieldCheck className="h-4 w-4" />
      <AlertTitle>Yaxii setup removed. Manual WooCommerce zones were not touched.</AlertTitle>
      <AlertDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-2" onClick={onLaunchWizard}>
            <Wand2 className="h-4 w-4" />
            Generate shipping zones
          </Button>
        </div>
        {response.warnings.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {response.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

function removalWorkAvailable(response: ManagedSetupRemovalPreview): boolean {
  return (
    response.removalAvailable && (removableZoneCount(response) > 0 || hasRegistryCleanup(response))
  );
}

function removableZoneCount(response: ManagedSetupRemovalPreview): number {
  return response.zonesToRemoveLater.filter((zone) => zone.canRemove).length;
}

function hasRegistryCleanup(response: ManagedSetupRemovalPreview): boolean {
  return response.orphanRegistryRecords.length > 0 || response.orphanMethodRecords.length > 0;
}

function removalHasBlockers(response: ManagedSetupRemovalPreview): boolean {
  return response.blockedZones.length > 0 || response.blockingReasons.length > 0;
}

function removalWarningCount(response: ManagedSetupRemovalPreview): number {
  return (
    response.registryWarnings.length +
    response.blockingReasons.length +
    response.blockedZones.length
  );
}

function RemovalPreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RemovalPreviewList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: string[];
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-sm font-medium">{title}</div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 max-h-44 space-y-1 overflow-auto text-sm text-muted-foreground">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      )}
    </div>
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
