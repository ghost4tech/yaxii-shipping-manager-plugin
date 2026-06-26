import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type LazyExoticComponent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  Eye,
  LayoutDashboard,
  Loader2,
  Settings,
  Stethoscope,
  Truck,
  Wand2,
} from "lucide-react";

import {
  fetchBootstrap,
  localizedBootstrap,
  type YaxiiShippingManagerBootstrap,
} from "./wp-admin-bootstrap";

type BootstrapState =
  | { status: "loading"; config?: YaxiiShippingManagerBootstrap }
  | { status: "ready"; config: YaxiiShippingManagerBootstrap }
  | { status: "error"; config?: YaxiiShippingManagerBootstrap; message: string };

type AdminRoute = {
  path: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  Screen: LazyExoticComponent<() => ReactElement>;
};

const routes: AdminRoute[] = [
  {
    path: "/",
    label: "Dashboard",
    description: "Setup health and next action",
    icon: LayoutDashboard,
    Screen: lazy(() => import("./wp-admin-screens/Dashboard")),
  },
  {
    path: "/wizard",
    label: "Wizard",
    description: "Guided setup intent",
    icon: Wand2,
    Screen: lazy(() => import("./wp-admin-screens/Wizard")),
  },
  {
    path: "/manager",
    label: "Shipping Manager",
    description: "Wilaya pricing table",
    icon: Truck,
    Screen: lazy(() => import("./wp-admin-screens/ShippingManager")),
  },
  {
    path: "/preview",
    label: "Preview",
    description: "Dry-run plan placeholder",
    icon: Eye,
    Screen: lazy(() => import("./wp-admin-screens/Preview")),
  },
  {
    path: "/diagnostics",
    label: "Diagnostics",
    description: "Read-only checks placeholder",
    icon: Stethoscope,
    Screen: lazy(() => import("./wp-admin-screens/Diagnostics")),
  },
  {
    path: "/import-export",
    label: "Import/Export",
    description: "CSV workflow placeholder",
    icon: Download,
    Screen: lazy(() => import("./wp-admin-screens/ImportExport")),
  },
  {
    path: "/ysf-sync",
    label: "YSF Sync",
    description: "Coming later",
    icon: ClipboardCheck,
    Screen: lazy(() => import("./wp-admin-screens/YsfSync")),
  },
  {
    path: "/settings",
    label: "Settings",
    description: "Local settings placeholder",
    icon: Settings,
    Screen: lazy(() => import("./wp-admin-screens/Settings")),
  },
];

const routePaths = new Set(routes.map((route) => route.path));

export function WordPressAdminApp() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>(() => {
    const config = localizedBootstrap();

    return config
      ? { status: "loading", config }
      : { status: "error", message: "Missing WordPress bootstrap config." };
  });
  const [activePath, setActivePath] = useState(currentHashPath);

  useEffect(() => {
    fetchBootstrap()
      .then((config) => setBootstrapState({ status: "ready", config }))
      .catch((error: Error) => {
        setBootstrapState((currentState) => ({
          status: "error",
          config: currentState.config,
          message: error.message,
        }));
      });
  }, []);

  useEffect(() => {
    const syncHashPath = () => setActivePath(currentHashPath());

    window.addEventListener("hashchange", syncHashPath);
    syncHashPath();

    return () => window.removeEventListener("hashchange", syncHashPath);
  }, []);

  if (bootstrapState.status === "loading") {
    return <LoadingState config={bootstrapState.config} />;
  }

  if (bootstrapState.status === "error") {
    return <ErrorState config={bootstrapState.config} message={bootstrapState.message} />;
  }

  return <AdminShell activePath={activePath} config={bootstrapState.config} />;
}

function AdminShell({
  activePath,
  config,
}: {
  activePath: string;
  config: YaxiiShippingManagerBootstrap;
}) {
  const activeRoute = useMemo(
    () => routes.find((route) => route.path === activePath),
    [activePath],
  );
  const routeAvailable = routePaths.has(activePath);

  return (
    <div className="ysm-admin-app">
      <aside className="ysm-sidebar" aria-label="Yaxii Shipping Manager">
        <div className="ysm-brand">
          <span className="ysm-brand-mark">YS</span>
          <div>
            <div className="ysm-brand-name">Yaxii Shipping</div>
            <div className="ysm-brand-subtitle">Algeria shipping setup</div>
          </div>
        </div>

        <nav className="ysm-nav" aria-label="Plugin sections">
          {routes.map((route) => (
            <NavLink
              key={route.path}
              active={route.path === activePath}
              description={route.description}
              href={`#${route.path}`}
              icon={route.icon}
              label={route.label}
            />
          ))}
        </nav>
      </aside>

      <div className="ysm-main">
        <header className="ysm-topbar">
          <div>
            <p className="ysm-eyebrow">Yaxii Shipping Manager</p>
            <h1>{activeRoute?.label ?? "Not available"}</h1>
          </div>
          <div className="ysm-status-group">
            <StatusPill tone={config.woocommerceActive ? "good" : "warn"}>
              {config.woocommerceActive ? "WooCommerce active" : "WooCommerce inactive"}
            </StatusPill>
            <StatusPill tone="neutral">REST bootstrap ready</StatusPill>
            <StatusPill tone="neutral">v{config.pluginVersion}</StatusPill>
          </div>
        </header>

        <main className="ysm-content">
          <Suspense fallback={<RouteLoading />}>
            {routeAvailable && activeRoute ? <activeRoute.Screen /> : <MvpUnavailable />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  active,
  description,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  description: string;
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <a className={active ? "ysm-nav-link is-active" : "ysm-nav-link"} href={href}>
      <Icon aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </a>
  );
}

function LoadingState({ config }: { config?: YaxiiShippingManagerBootstrap }) {
  return (
    <div className="ysm-admin-app ysm-centered-state">
      <Loader2 className="ysm-spinner" aria-hidden="true" />
      <h1>Loading Yaxii Shipping Manager</h1>
      <p>Checking the WordPress REST bootstrap before showing the admin app.</p>
      {config && <StatusPill tone="neutral">v{config.pluginVersion}</StatusPill>}
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
    <div className="ysm-admin-app ysm-centered-state">
      <AlertTriangle className="ysm-error-icon" aria-hidden="true" />
      <h1>Admin app could not load</h1>
      <p>{message}</p>
      {config && <StatusPill tone="neutral">v{config.pluginVersion}</StatusPill>}
    </div>
  );
}

function RouteLoading() {
  return (
    <div className="ysm-panel ysm-route-loading">
      <Loader2 className="ysm-spinner" aria-hidden="true" />
      <span>Loading section</span>
    </div>
  );
}

function MvpUnavailable() {
  return (
    <section className="ysm-panel ysm-empty-state">
      <h2>Not available in the free MVP</h2>
      <p>
        This route is hidden from navigation while the plugin focuses on the free Algeria shipping
        setup workflow.
      </p>
      <a className="ysm-button" href="#/">
        Back to dashboard
      </a>
    </section>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "good" | "warn" | "neutral";
}) {
  return <span className={`ysm-status-pill is-${tone}`}>{children}</span>;
}

function currentHashPath() {
  const hashPath = window.location.hash.replace(/^#/, "");

  if (!hashPath || hashPath === "#") {
    return "/";
  }

  return hashPath.startsWith("/") ? hashPath : `/${hashPath}`;
}
