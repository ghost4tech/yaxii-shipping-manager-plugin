import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  Package,
  Settings,
  ShieldCheck,
  Upload,
  Wand2,
} from "lucide-react";

import {
  fetchBootstrap,
  localizedBootstrap,
  type YaxiiShippingManagerBootstrap,
} from "./bootstrap";
import { Notice } from "./components/Notice";
import { StatusPill } from "./components/StatusPill";
import { TopNav, type NavigationItem } from "./components/TopNav";
import { initialWilayaDrafts } from "./data/mock-data";
import { DiagnosticsScreen } from "./screens/DiagnosticsScreen";
import { ImportExportScreen } from "./screens/ImportExportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { ShippingZonesScreen } from "./screens/ShippingZonesScreen";
import { SmartFormSyncScreen } from "./screens/SmartFormSyncScreen";
import type { DatasetMode, ScreenId, SetupPath, WilayaDraft } from "./types";

type BootstrapState =
  | { status: "loading"; config?: YaxiiShippingManagerBootstrap }
  | { status: "ready"; config: YaxiiShippingManagerBootstrap }
  | { status: "error"; config?: YaxiiShippingManagerBootstrap; message: string };

const navigationItems: NavigationItem[] = [
  {
    id: "setup",
    label: "Setup",
    description: "Guided shipping setup",
    icon: Wand2,
  },
  {
    id: "zones",
    label: "Shipping Zones",
    description: "Wilaya price table",
    icon: Package,
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    description: "Checkout protection",
    icon: ShieldCheck,
  },
  {
    id: "import-export",
    label: "Import / Export",
    description: "Local CSV workflows",
    icon: Upload,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Safety defaults",
    icon: Settings,
  },
  {
    id: "sync",
    label: "Smart Form Sync",
    description: "Coming later",
    icon: ClipboardCheck,
  },
];

const screenIds = new Set<ScreenId>(navigationItems.map((item) => item.id));

export function App() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>(() => {
    const config = localizedBootstrap();
    return config
      ? { status: "loading", config }
      : { status: "error", message: "Missing WordPress bootstrap config." };
  });
  const [activeScreen, setActiveScreen] = useState<ScreenId>(currentHashScreen);
  const [datasetMode, setDatasetMode] = useState<DatasetMode>("current");
  const [selectedSetupPath, setSelectedSetupPath] = useState<SetupPath>("quick");
  const [wilayas, setWilayas] = useState<WilayaDraft[]>(initialWilayaDrafts);

  useEffect(() => {
    fetchBootstrap()
      .then((config) => setBootstrapState({ status: "ready", config }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Bootstrap request failed.";
        setBootstrapState((currentState) => ({
          status: "error",
          config: currentState.config,
          message,
        }));
      });
  }, []);

  useEffect(() => {
    const syncFromHash = () => setActiveScreen(currentHashScreen());

    window.addEventListener("hashchange", syncFromHash);
    syncFromHash();

    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  if (bootstrapState.status === "loading") {
    return <LoadingState config={bootstrapState.config} />;
  }

  if (bootstrapState.status === "error") {
    return <ErrorState config={bootstrapState.config} message={bootstrapState.message} />;
  }

  return (
    <AdminShell
      activeScreen={activeScreen}
      bootstrap={bootstrapState.config}
      datasetMode={datasetMode}
      onDatasetModeChange={setDatasetMode}
      onNavigate={setActiveHashScreen}
      onSetupPathChange={setSelectedSetupPath}
      onWilayasChange={setWilayas}
      selectedSetupPath={selectedSetupPath}
      wilayas={wilayas}
    />
  );
}

function AdminShell({
  activeScreen,
  bootstrap,
  datasetMode,
  onDatasetModeChange,
  onNavigate,
  onSetupPathChange,
  onWilayasChange,
  selectedSetupPath,
  wilayas,
}: {
  activeScreen: ScreenId;
  bootstrap: YaxiiShippingManagerBootstrap;
  datasetMode: DatasetMode;
  onDatasetModeChange: (mode: DatasetMode) => void;
  onNavigate: (screen: ScreenId) => void;
  onSetupPathChange: (path: SetupPath) => void;
  onWilayasChange: (wilayas: WilayaDraft[]) => void;
  selectedSetupPath: SetupPath;
  wilayas: WilayaDraft[];
}) {
  const enabledFeatureCount = useMemo(
    () => Object.values(bootstrap.featureFlags).filter(Boolean).length,
    [bootstrap.featureFlags],
  );

  return (
    <div className="yaxii-shipping-manager-app">
      <header className="ysm-header">
        <div className="ysm-brand-lockup">
          <div className="ysm-brand-mark">YS</div>
          <div>
            <p>Yaxii Shipping Manager</p>
            <h1>Algeria shipping setup for WooCommerce</h1>
          </div>
        </div>
        <div className="ysm-status-group">
          <StatusPill tone={bootstrap.woocommerceActive ? "good" : "warn"}>
            {bootstrap.woocommerceActive ? "WooCommerce active" : "WooCommerce inactive"}
          </StatusPill>
          <StatusPill>REST bootstrap ready</StatusPill>
          <StatusPill>v{bootstrap.pluginVersion}</StatusPill>
        </div>
      </header>

      <TopNav activeScreen={activeScreen} items={navigationItems} onNavigate={onNavigate} />

      <main className="ysm-main">
        {!bootstrap.woocommerceActive && (
          <Notice tone="warn">
            WooCommerce is inactive. The app remains loaded in frontend foundation mode without
            reading or writing store shipping configuration.
          </Notice>
        )}

        {enabledFeatureCount === 0 && (
          <Notice>
            Product endpoints are not available yet. This canonical frontend is local, mock, and
            read-only until dataset and diagnostics tasks land.
          </Notice>
        )}

        {activeScreen === "setup" && (
          <SetupScreen
            datasetMode={datasetMode}
            onDatasetModeChange={onDatasetModeChange}
            onNavigate={onNavigate}
            onSetupPathChange={onSetupPathChange}
            selectedPath={selectedSetupPath}
            wilayas={wilayas}
          />
        )}
        {activeScreen === "zones" && (
          <ShippingZonesScreen onWilayasChange={onWilayasChange} wilayas={wilayas} />
        )}
        {activeScreen === "diagnostics" && (
          <DiagnosticsScreen wilayas={wilayas} woocommerceActive={bootstrap.woocommerceActive} />
        )}
        {activeScreen === "import-export" && <ImportExportScreen />}
        {activeScreen === "settings" && (
          <SettingsScreen datasetMode={datasetMode} onDatasetModeChange={onDatasetModeChange} />
        )}
        {activeScreen === "sync" && <SmartFormSyncScreen />}
      </main>
    </div>
  );
}

function LoadingState({ config }: { config?: YaxiiShippingManagerBootstrap }) {
  return (
    <div className="yaxii-shipping-manager-app is-centered">
      <Loader2 aria-hidden="true" />
      <h1>Loading Yaxii Shipping Manager</h1>
      <p>Checking the WordPress REST bootstrap before rendering the admin app.</p>
      {config && <StatusPill>v{config.pluginVersion}</StatusPill>}
    </div>
  );
}

function ErrorState({
  config,
  message,
}: {
  config?: YaxiiShippingManagerBootstrap;
  message: string;
}) {
  return (
    <div className="yaxii-shipping-manager-app is-centered">
      <AlertTriangle aria-hidden="true" />
      <h1>Admin app could not load</h1>
      <p>{message}</p>
      {config && <StatusPill>v{config.pluginVersion}</StatusPill>}
    </div>
  );
}

function currentHashScreen(): ScreenId {
  const rawHash = window.location.hash.replace(/^#\/?/, "");
  return isScreenId(rawHash) ? rawHash : "setup";
}

function setActiveHashScreen(screen: ScreenId) {
  window.location.hash = `/${screen}`;
}

function isScreenId(screen: string): screen is ScreenId {
  return screenIds.has(screen as ScreenId);
}
