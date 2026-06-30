import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
import type { DiagnosticsResponse } from "../types/diagnostics";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { enabledMethodDefs } from "@/lib/generator/methods";
import { parseOptionalPrice } from "@/lib/generator/pricing";
import { cn } from "@/lib/utils";

const DEFAULT_METHOD_DEFS: MethodDef[] = enabledMethodDefs(DEFAULT_SHIPPING_METHOD_TEMPLATES);

const TABS = [
  { id: "zones", label: "Shipping Zones", icon: Package },
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
      <main className="mx-auto w-full max-w-[1240px] px-6 pb-32 pt-8">
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
          <SettingsScreen settingsState={settingsState} onSave={savePersistedSettings} />
        )}
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
          diagnostics={diagnosticsState.status === "ready" ? diagnosticsState.response : undefined}
          onClose={() => setWizardOpen(false)}
          onComplete={(next, defs) => {
            setWilayas(next);
            setMethodDefs(defs);
            setWizardOpen(false);
            setTab("zones");
          }}
          onPreviewReady={(response, context, request) =>
            setLatestPreview({ response, context, request })
          }
          onOpenDiagnostics={() => closeWizardAndOpenDiagnostics()}
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
  onSave,
}: {
  settingsState: SettingsLoadState;
  onSave: (settings: PersistedSettings) => Promise<SettingsResponse>;
}) {
  if (settingsState.status === "loading") {
    return (
      <>
        <SectionHeader
          title="Defaults for future setup"
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
        <SectionHeader
          title="Defaults for future setup"
          description="Saved defaults could not be loaded."
        />
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
      setSaveMessage("Defaults saved. Existing WooCommerce shipping zones were not changed.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Settings could not be saved.");
    }
  };

  return (
    <>
      <SectionHeader
        title="Defaults for future setup"
        description="Save labels, prices, and naming defaults for future Generator previews. Existing WooCommerce shipping zones are not changed here."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => saveDraft(response.defaults)}
              disabled={saveState === "saving"}
            >
              Reset defaults
            </Button>
            <Button onClick={() => saveDraft(draft)} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Saving..." : "Save defaults"}
            </Button>
          </div>
        }
      />
      {saveState === "saved" && (
        <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Defaults saved</AlertTitle>
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
          <SettingRow
            label="Dataset mode"
            desc="Controls future Generator previews and read-only diagnostics coverage."
          >
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
                  <SelectItem key={option.mode} value={option.mode}>
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
          <SettingRow
            label="Zone name format"
            desc="Existing WooCommerce zone names are not changed by saving settings."
          >
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
          <SettingRow
            label="Zone prefix"
            desc="Existing WooCommerce zone names are not changed by saving settings."
          >
            <Input
              value={draft.zonePrefix}
              onChange={(event) => updateDraft({ zonePrefix: event.target.value })}
              className="w-44"
            />
          </SettingRow>
          <Separator />
          <SettingRow
            label="Office method wording"
            desc="Default label for future setup previews. Use Shipping Zones to update live WooCommerce prices."
          >
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
            <SettingRow label="Office custom label" desc="Future setup default label only.">
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
          <div className="rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            Use Shipping Zones to update live WooCommerce prices. These labels and default prices
            are used for future setup previews.
          </div>
          <Separator />
          {draft.methods.map((method) => (
            <SettingRow
              key={method.key}
              label={method.label}
              desc={
                method.locked
                  ? "Required flat_rate method default for future setup."
                  : "Optional flat_rate method default for future setup."
              }
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
