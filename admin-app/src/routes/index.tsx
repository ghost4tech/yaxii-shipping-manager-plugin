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
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";

import type { BootstrapPayload } from "../bootstrap";
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

type MethodDef = { id: string; label: string };

const DEFAULT_METHOD_DEFS: MethodDef[] = [
  { id: "home", label: "Home delivery" },
  { id: "office", label: "Office / Stopdesk" },
];

const SEED: Array<Omit<Wilaya, "methods"> & { home: number; office: number }> = [
  {
    code: "16",
    name: "Alger",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "managed",
    home: 500,
    office: 300,
  },
  {
    code: "31",
    name: "Oran",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "ready",
    home: 800,
    office: 500,
  },
  {
    code: "25",
    name: "Constantine",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "needs_update",
    home: 700,
    office: 450,
  },
  {
    code: "09",
    name: "Blida",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "managed",
    home: 550,
    office: 350,
  },
  {
    code: "06",
    name: "Bejaia",
    ar: "Arabic label pending TASK-002",
    enabled: false,
    status: "missing",
    home: 900,
    office: 600,
  },
  {
    code: "05",
    name: "Batna",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "manual",
    home: 850,
    office: 550,
  },
  {
    code: "19",
    name: "Setif",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "managed",
    home: 800,
    office: 500,
  },
  {
    code: "35",
    name: "Boumerdes",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "ready",
    home: 600,
    office: 400,
  },
  {
    code: "13",
    name: "Tlemcen",
    ar: "Arabic label pending TASK-002",
    enabled: false,
    status: "conflict",
    home: 1100,
    office: 750,
  },
  {
    code: "23",
    name: "Annaba",
    ar: "Arabic label pending TASK-002",
    enabled: true,
    status: "managed",
    home: 950,
    office: 650,
  },
];

const INITIAL_WILAYAS: Wilaya[] = SEED.map((seed) => ({
  code: seed.code,
  name: seed.name,
  ar: seed.ar,
  enabled: seed.enabled,
  status: seed.status,
  methods: {
    home: { id: "home", label: "Home delivery", price: seed.home, enabled: true },
    office: { id: "office", label: "Office / Stopdesk", price: seed.office, enabled: true },
  },
}));

const TABS = [
  { id: "zones", label: "Shipping Zones", icon: Package },
  { id: "generator", label: "Generator", icon: Wand2 },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "import", label: "Import / Export", icon: Upload },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "sync", label: "Smart Form Sync", icon: Zap },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Dataset = "current" | "legacy";
type ImportMode = "manual" | "csv";

const WILAYA_REFERENCE: Array<{ code: string; name: string; ar: string }> = [
  { code: "01", name: "Adrar", ar: "Arabic label pending TASK-002" },
  { code: "02", name: "Chlef", ar: "Arabic label pending TASK-002" },
  { code: "03", name: "Laghouat", ar: "Arabic label pending TASK-002" },
  { code: "04", name: "Oum El Bouaghi", ar: "Arabic label pending TASK-002" },
  { code: "05", name: "Batna", ar: "Arabic label pending TASK-002" },
  { code: "06", name: "Bejaia", ar: "Arabic label pending TASK-002" },
  { code: "07", name: "Biskra", ar: "Arabic label pending TASK-002" },
  { code: "08", name: "Bechar", ar: "Arabic label pending TASK-002" },
  { code: "09", name: "Blida", ar: "Arabic label pending TASK-002" },
  { code: "10", name: "Bouira", ar: "Arabic label pending TASK-002" },
  { code: "11", name: "Tamanrasset", ar: "Arabic label pending TASK-002" },
  { code: "12", name: "Tebessa", ar: "Arabic label pending TASK-002" },
  { code: "13", name: "Tlemcen", ar: "Arabic label pending TASK-002" },
  { code: "14", name: "Tiaret", ar: "Arabic label pending TASK-002" },
  { code: "15", name: "Tizi Ouzou", ar: "Arabic label pending TASK-002" },
  { code: "16", name: "Alger", ar: "Arabic label pending TASK-002" },
  { code: "17", name: "Djelfa", ar: "Arabic label pending TASK-002" },
  { code: "18", name: "Jijel", ar: "Arabic label pending TASK-002" },
  { code: "19", name: "Setif", ar: "Arabic label pending TASK-002" },
  { code: "20", name: "Saida", ar: "Arabic label pending TASK-002" },
  { code: "21", name: "Skikda", ar: "Arabic label pending TASK-002" },
  { code: "22", name: "Sidi Bel Abbes", ar: "Arabic label pending TASK-002" },
  { code: "23", name: "Annaba", ar: "Arabic label pending TASK-002" },
  { code: "24", name: "Guelma", ar: "Arabic label pending TASK-002" },
  { code: "25", name: "Constantine", ar: "Arabic label pending TASK-002" },
  { code: "26", name: "Medea", ar: "Arabic label pending TASK-002" },
  { code: "27", name: "Mostaganem", ar: "Arabic label pending TASK-002" },
  { code: "28", name: "M'Sila", ar: "Arabic label pending TASK-002" },
  { code: "29", name: "Mascara", ar: "Arabic label pending TASK-002" },
  { code: "30", name: "Ouargla", ar: "Arabic label pending TASK-002" },
  { code: "31", name: "Oran", ar: "Arabic label pending TASK-002" },
  { code: "32", name: "El Bayadh", ar: "Arabic label pending TASK-002" },
  { code: "33", name: "Illizi", ar: "Arabic label pending TASK-002" },
  { code: "34", name: "Bordj Bou Arreridj", ar: "Arabic label pending TASK-002" },
  { code: "35", name: "Boumerdes", ar: "Arabic label pending TASK-002" },
  { code: "36", name: "El Tarf", ar: "Arabic label pending TASK-002" },
  { code: "37", name: "Tindouf", ar: "Arabic label pending TASK-002" },
  { code: "38", name: "Tissemsilt", ar: "Arabic label pending TASK-002" },
  { code: "39", name: "El Oued", ar: "Arabic label pending TASK-002" },
  { code: "40", name: "Khenchela", ar: "Arabic label pending TASK-002" },
  { code: "41", name: "Souk Ahras", ar: "Arabic label pending TASK-002" },
  { code: "42", name: "Tipaza", ar: "Arabic label pending TASK-002" },
  { code: "43", name: "Mila", ar: "Arabic label pending TASK-002" },
  { code: "44", name: "Ain Defla", ar: "Arabic label pending TASK-002" },
  { code: "45", name: "Naama", ar: "Arabic label pending TASK-002" },
  { code: "46", name: "Ain Temouchent", ar: "Arabic label pending TASK-002" },
  { code: "47", name: "Ghardaia", ar: "Arabic label pending TASK-002" },
  { code: "48", name: "Relizane", ar: "Arabic label pending TASK-002" },
  { code: "49", name: "El M'Ghair", ar: "Arabic label pending TASK-002" },
  { code: "50", name: "El Meniaa", ar: "Arabic label pending TASK-002" },
  { code: "51", name: "Ouled Djellal", ar: "Arabic label pending TASK-002" },
  { code: "52", name: "Bordj Baji Mokhtar", ar: "Arabic label pending TASK-002" },
  { code: "53", name: "Beni Abbes", ar: "Arabic label pending TASK-002" },
  { code: "54", name: "Timimoun", ar: "Arabic label pending TASK-002" },
  { code: "55", name: "Touggourt", ar: "Arabic label pending TASK-002" },
  { code: "56", name: "Djanet", ar: "Arabic label pending TASK-002" },
  { code: "57", name: "In Salah", ar: "Arabic label pending TASK-002" },
  { code: "58", name: "In Guezzam", ar: "Arabic label pending TASK-002" },
];

export default function AdminApp({ bootstrap }: { bootstrap: BootstrapPayload }) {
  const [tab, setTabState] = useState<TabId>(getInitialTab);
  const [wilayas, setWilayas] = useState<Wilaya[]>(INITIAL_WILAYAS);
  const [methodDefs, setMethodDefs] = useState<MethodDef[]>(DEFAULT_METHOD_DEFS);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => setTabState(getInitialTab());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setTab = (next: TabId) => {
    setTabState(next);
    window.location.hash = `/${next}`;
  };

  return (
    <div className="yaxii-shipping-manager-app min-h-screen bg-background text-foreground">
      <Header pluginVersion={bootstrap.pluginVersion} onLaunchWizard={() => setWizardOpen(true)} />
      <TopNav tab={tab} setTab={setTab} />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <RuntimeNotices bootstrap={bootstrap} />
        {tab === "zones" && (
          <ZonesScreen
            wilayas={wilayas}
            setWilayas={setWilayas}
            methodDefs={methodDefs}
            onLaunchWizard={() => setWizardOpen(true)}
          />
        )}
        {tab === "generator" && <GeneratorHub onLaunch={() => setWizardOpen(true)} />}
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

function RuntimeNotices({ bootstrap }: { bootstrap: BootstrapPayload }) {
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
          This screen does not write to WooCommerce. Dataset hardening, diagnostics, preview
          planning, CSV import, and safe apply are later tasks.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Header({
  pluginVersion,
  onLaunchWizard,
}: {
  pluginVersion: string;
  onLaunchWizard: () => void;
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
        <Button onClick={onLaunchWizard} className="gap-2">
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

function GeneratorHub({ onLaunch }: { onLaunch: () => void }) {
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
              <Button className="mt-6 gap-2" onClick={onLaunch}>
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
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (wilayas: Wilaya[], defs: MethodDef[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [dataset, setDataset] = useState<Dataset>("current");
  const [mode, setMode] = useState<ImportMode>("manual");
  const [methodDefs, setMethodDefs] = useState<MethodDef[]>(DEFAULT_METHOD_DEFS);
  const [rows, setRows] = useState<Record<string, Record<string, number | null | undefined>>>({});

  const baseList = useMemo(() => WILAYA_REFERENCE, []);
  const steps = ["Dataset", "Methods", "Import", "Prices", "Review"] as const;
  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const buildDraft = (): Wilaya[] =>
    baseList.map((wilaya) => {
      const methods: Record<string, Method> = {};
      methodDefs.forEach((method) => {
        const price = rows[wilaya.code]?.[method.id];
        methods[method.id] = {
          id: method.id,
          label: method.label,
          enabled: price !== undefined,
          price: price ?? undefined,
        };
      });

      return {
        code: wilaya.code,
        name: wilaya.name,
        ar: wilaya.ar,
        enabled: true,
        status: "ready",
        methods,
      };
    });

  const useLocalDraft = () => onComplete(buildDraft(), methodDefs);

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
          {step === 0 && <StepDataset dataset={dataset} setDataset={setDataset} />}
          {step === 1 && <StepMethods defs={methodDefs} setDefs={setMethodDefs} />}
          {step === 2 && (
            <StepImport
              mode={mode}
              setMode={setMode}
              methodDefs={methodDefs}
              baseList={baseList}
              setRows={setRows}
            />
          )}
          {step === 3 && (
            <StepPrices baseList={baseList} methodDefs={methodDefs} rows={rows} setRows={setRows} />
          )}
          {step === 4 && (
            <StepReview baseList={baseList} methodDefs={methodDefs} rows={rows} dataset={dataset} />
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

function StepDataset({
  dataset,
  setDataset,
}: {
  dataset: Dataset;
  setDataset: (dataset: Dataset) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Pick your wilaya dataset mode</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The full dataset will be verified in TASK-002. Current inline data is mock/reference only.
      </p>
      <RadioGroup
        value={dataset}
        onValueChange={(value) => setDataset(value as Dataset)}
        className="mt-6 space-y-3"
      >
        <DatasetCard
          value="current"
          current={dataset}
          title="Current Algeria dataset"
          desc="Use this for the future verified Algeria dataset after TASK-002 hardening."
          badge="Recommended"
        />
        <DatasetCard
          value="legacy"
          current={dataset}
          title="Legacy 58-compatible dataset"
          desc="Keep compatibility with stores or files that still use the older wilaya coding model."
        />
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
}: {
  value: Dataset;
  current: Dataset;
  title: string;
  desc: string;
  badge?: string;
}) {
  const active = value === current;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-5 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      <RadioGroupItem value={value} className="mt-1" />
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

function StepMethods({
  defs,
  setDefs,
}: {
  defs: MethodDef[];
  setDefs: (defs: MethodDef[]) => void;
}) {
  const [label, setLabel] = useState("");
  const add = () => {
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      return;
    }

    const id = `${cleanLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 24)}_${Math.random().toString(36).slice(2, 6)}`;
    setDefs([...defs, { id, label: cleanLabel }]);
    setLabel("");
  };

  const remove = (id: string) => setDefs(defs.filter((def) => def.id !== id));

  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-2xl font-semibold tracking-tight">Define your shipping methods</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        These methods are stored in the local draft only. The WooCommerce apply engine is not
        connected yet.
      </p>
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="space-y-2">
            {defs.map((def) => (
              <div
                key={def.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Package className="h-4 w-4" />
                </div>
                <Input
                  value={def.label}
                  onChange={(event) =>
                    setDefs(
                      defs.map((item) =>
                        item.id === def.id ? { ...item, label: event.target.value } : item,
                      ),
                    )
                  }
                  className="h-8 min-w-48 flex-1"
                />
                <code className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                  {def.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(def.id)}
                  disabled={defs.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="New method label (e.g. Express, Cash on delivery)"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && add()}
            />
            <Button onClick={add} variant="outline">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepImport({
  mode,
  setMode,
  methodDefs,
  baseList,
  setRows,
}: {
  mode: ImportMode;
  setMode: (mode: ImportMode) => void;
  methodDefs: MethodDef[];
  baseList: Array<{ code: string; name: string; ar: string }>;
  setRows: Dispatch<SetStateAction<Record<string, Record<string, number | null | undefined>>>>;
}) {
  const sampleCsv = useMemo(() => {
    const head = ["code", "name", ...methodDefs.map((method) => method.id)].join(",");
    const row1 = ["16", "Alger", ...methodDefs.map(() => "500")].join(",");
    const row2 = ["31", "Oran", ...methodDefs.map(() => "800")].join(",");
    return `${head}\n${row1}\n${row2}`;
  }, [methodDefs]);

  const seedAll = (price: number) => {
    const next: Record<string, Record<string, number | null | undefined>> = {};
    baseList.forEach((wilaya) => {
      next[wilaya.code] = {};
      methodDefs.forEach((method) => {
        next[wilaya.code]![method.id] = price;
      });
    });
    setRows(next);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">How will you bring in your prices?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Manual entry works as a local draft. CSV validation and import backend are coming in a later
        task.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <ImportPathCard
          active={mode === "manual"}
          onClick={() => setMode("manual")}
          icon={<Edit3 className="h-4 w-4" />}
          title="Fill in the table"
          desc="Type prices for every wilaya directly in the next step."
        />
        <ImportPathCard
          active={mode === "csv"}
          onClick={() => setMode("csv")}
          icon={<FileSpreadsheet className="h-4 w-4" />}
          title="Prepare CSV"
          desc="Preview the CSV shape. Upload is not connected yet."
        />
      </div>

      {mode === "manual" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Optional starting price</CardTitle>
            <CardDescription>
              Pre-fill every wilaya and method with the same draft price so you only edit the
              differences.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              id="seed"
              type="number"
              placeholder="e.g. 700"
              className="w-40"
              onChange={(event) => event.target.value && seedAll(Number(event.target.value))}
            />
            <span className="text-xs text-muted-foreground">
              Press Tab to apply to the local draft.
            </span>
          </CardContent>
        </Card>
      )}

      {mode === "csv" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">CSV format</CardTitle>
            <CardDescription>
              One row per wilaya. Columns:{" "}
              <code className="rounded bg-muted px-1 py-0.5">code</code>,
              <code className="ml-1 rounded bg-muted px-1 py-0.5">name</code>, plus one column per
              method id.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs">
              {sampleCsv}
            </pre>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
              <FileUp className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">CSV backend not connected yet</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Upload className="h-4 w-4" /> Select file
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Download className="h-4 w-4" /> Sample CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
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

function StepPrices({
  baseList,
  methodDefs,
  rows,
  setRows,
}: {
  baseList: Array<{ code: string; name: string; ar: string }>;
  methodDefs: MethodDef[];
  rows: Record<string, Record<string, number | null | undefined>>;
  setRows: Dispatch<SetStateAction<Record<string, Record<string, number | null | undefined>>>>;
}) {
  const setVal = (code: string, methodId: string, raw: string) => {
    setRows((previous) => {
      const next = { ...previous, [code]: { ...(previous[code] ?? {}) } };
      if (raw === "") {
        next[code]![methodId] = undefined;
      } else if (raw.toLowerCase() === "free") {
        next[code]![methodId] = null;
      } else {
        next[code]![methodId] = Number(raw);
      }

      return next;
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold tracking-tight">Set prices per wilaya</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Leave a cell empty to skip that method for a wilaya. Type{" "}
        <code className="rounded bg-muted px-1 py-0.5">free</code> for free shipping.
      </p>
      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Code</TableHead>
              <TableHead>Wilaya</TableHead>
              {methodDefs.map((method) => (
                <TableHead key={method.id} className="w-36">
                  {method.label} (DZD)
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {baseList.map((wilaya) => (
              <TableRow key={wilaya.code}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {wilaya.code}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{wilaya.name}</div>
                  <div className="text-xs text-muted-foreground">{wilaya.ar}</div>
                </TableCell>
                {methodDefs.map((method) => {
                  const value = rows[wilaya.code]?.[method.id];
                  const display =
                    value === null ? "free" : value === undefined ? "" : String(value);
                  return (
                    <TableCell key={method.id}>
                      <Input
                        value={display}
                        placeholder="-"
                        className="h-8"
                        onChange={(event) => setVal(wilaya.code, method.id, event.target.value)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StepReview({
  baseList,
  methodDefs,
  rows,
  dataset,
}: {
  baseList: Array<{ code: string; name: string; ar: string }>;
  methodDefs: MethodDef[];
  rows: Record<string, Record<string, number | null | undefined>>;
  dataset: Dataset;
}) {
  let totalMethods = 0;
  let priced = 0;
  let free = 0;
  let skipped = 0;
  baseList.forEach((wilaya) => {
    methodDefs.forEach((method) => {
      const value = rows[wilaya.code]?.[method.id];
      if (value === undefined) {
        skipped++;
      } else if (value === null) {
        free++;
        totalMethods++;
      } else {
        priced++;
        totalMethods++;
      }
    });
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-2xl font-semibold tracking-tight">Preview local draft</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing has been written to WooCommerce. Use this draft now, then TASK-002 and later backend
        tasks will replace the mock data path.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStat label="Dataset mode" value={dataset === "current" ? "Current" : "Legacy"} />
        <PreviewStat label="Draft rows" value={String(baseList.length)} />
        <PreviewStat label="Draft method prices" value={String(totalMethods)} />
        <PreviewStat label="Methods skipped" value={String(skipped)} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Breakdown</CardTitle>
          <CardDescription>
            Each row keeps only the methods you priced in this local draft.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Priced methods</span>
            <Badge variant="outline">{priced}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Free methods</span>
            <Badge variant="outline">{free}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Skipped (not offered)</span>
            <Badge variant="outline">{skipped}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
  const [targetMethod, setTargetMethod] = useState<string>(methodDefs[0]?.id ?? "home");
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
                    label: methodDefs.find((method) => method.id === methodId)?.label ?? methodId,
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
                  <SelectItem key={method.id} value={method.id}>
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
                <TableHead key={method.id} className="w-36">
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
                    const value = wilaya.methods[method.id];
                    return (
                      <TableCell key={method.id}>
                        <MethodCell
                          method={value}
                          onChange={(patch) => updateMethod(wilaya.code, method.id, patch)}
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
  return (
    <>
      <SectionHeader
        title="Settings"
        description="Local defaults shown in the admin draft. Settings persistence is not connected yet."
      />
      <Card>
        <CardContent className="space-y-6 p-6">
          <SettingRow label="Dataset mode" desc="Full dataset will be verified in TASK-002.">
            <Select defaultValue="current">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Algeria dataset</SelectItem>
                <SelectItem value="legacy">Legacy 58-compatible dataset</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label="Currency label" desc="Shown next to draft prices.">
            <Input defaultValue="DZD" className="w-32" />
          </SettingRow>
          <Separator />
          <ToggleRow
            label="Protect manual WooCommerce zones"
            desc="Future apply engine must skip manual zones by default."
            defaultChecked
          />
          <ToggleRow
            label="Confirm before future apply engine"
            desc="No writes exist yet; preview planning comes first."
            defaultChecked
          />
          <ToggleRow label="Show Arabic names" defaultChecked />
          <ToggleRow label="Show French names" defaultChecked />
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
  defaultChecked,
}: {
  label: string;
  desc?: string;
  defaultChecked?: boolean;
}) {
  return (
    <SettingRow label={label} desc={desc}>
      <Switch defaultChecked={defaultChecked} />
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
