import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Search,
  X,
  Zap,
  Settings2,
  Upload,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WILAYAS, type Wilaya } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wizard")({
  head: () => ({ meta: [{ title: "Setup — Yaxii" }] }),
  component: WizardPage,
});

type SetupMode = "quick" | "manual" | "csv";
type Dataset = "58" | "68";

const STEPS = ["Welcome", "Path", "Dataset", "Wilayas", "Done"];

function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<SetupMode | null>(null);
  const [dataset, setDataset] = useState<Dataset>("58");
  const [rows, setRows] = useState<Wilaya[]>(WILAYAS);
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const visibleWilayas = useMemo(
    () => (dataset === "58" ? rows.filter((r) => !r.isDelegated) : rows),
    [rows, dataset],
  );

  const filtered = useMemo(
    () =>
      visibleWilayas.filter(
        (r) =>
          r.nameFr.toLowerCase().includes(query.toLowerCase()) ||
          r.code.includes(query),
      ),
    [visibleWilayas, query],
  );

  const enabledCount = visibleWilayas.filter((r) => r.enabled).length;

  const toggleAll = (v: boolean) =>
    setRows((rs) =>
      rs.map((r) => {
        if (dataset === "58" && r.isDelegated) return r;
        return { ...r, enabled: v };
      }),
    );

  const toggle = (code: string) =>
    setRows((rs) => rs.map((r) => (r.code === code ? { ...r, enabled: !r.enabled } : r)));

  const next = () => {
    // Skip manual selection when Quick setup is chosen
    if (step === 2 && mode === "quick") {
      toggleAll(true);
      setStep(4);
      return;
    }
    if (step === 2 && mode === "csv") {
      setStep(3); // still go to wilaya review after CSV
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const canAdvance =
    step === 0 ||
    (step === 1 && mode !== null) ||
    step === 2 ||
    (step === 3 && enabledCount > 0) ||
    step === 4;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background blobs — kept playful for onboarding only */}
      <div className="blob top-[-100px] left-[10%] h-72 w-72 bg-lilac animate-float" />
      <div className="blob bottom-[-80px] right-[5%] h-80 w-80 bg-peach animate-float" style={{ animationDelay: "3s" }} />
      <div className="blob top-[40%] right-[20%] h-56 w-56 bg-mint animate-float" style={{ animationDelay: "1.5s" }} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Yaxii Shipping</span>
        </Link>

        <div className="hidden items-center gap-1.5 sm:flex">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary" : "w-2 bg-border",
              )}
              aria-label={label}
            />
          ))}
        </div>

        <button
          onClick={() => navigate({ to: "/" })}
          className="flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-180px)] items-center justify-center px-6 py-6">
        <div key={step} className="w-full max-w-3xl animate-pop">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepMode mode={mode} setMode={setMode} />}
          {step === 2 && (
            <StepDataset
              dataset={dataset}
              setDataset={setDataset}
              mode={mode!}
              fileName={fileName}
              setFileName={setFileName}
            />
          )}
          {step === 3 && (
            <StepWilayas
              rows={visibleWilayas}
              filtered={filtered}
              query={query}
              setQuery={setQuery}
              toggle={toggle}
              toggleAll={toggleAll}
              enabledCount={enabledCount}
            />
          )}
          {step === 4 && <StepDone enabledCount={enabledCount} />}
        </div>
      </main>

      <footer className="relative z-10 flex items-center justify-between px-6 pb-8 sm:px-10">
        <Button variant="ghost" onClick={prev} disabled={step === 0}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </div>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canAdvance}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => navigate({ to: "/preview" })}>
            Review &amp; apply <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </footer>
    </div>
  );
}

/* ---------------- Steps ---------------- */

function StepWelcome() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Let's set up shipping for Algeria.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
        A guided setup for WooCommerce. Less than a minute, no code, no manual zone wrangling.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <span className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium">58 wilayas</span>
        <span className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium">Home + stop desk</span>
        <span className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium">Safe-by-default</span>
      </div>
    </div>
  );
}

function StepMode({ mode, setMode }: { mode: SetupMode | null; setMode: (m: SetupMode) => void }) {
  const options: { id: SetupMode; icon: React.ElementType; title: string; sub: string }[] = [
    { id: "quick", icon: Zap, title: "Quick setup", sub: "Generate all 58 wilayas with default prices. Best to get live fast." },
    { id: "manual", icon: Settings2, title: "Manual setup", sub: "Select wilayas now, configure prices later in the manager." },
    { id: "csv", icon: Upload, title: "Import CSV", sub: "Bring existing prices from a CSV file." },
  ];
  return (
    <div>
      <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        How would you like to start?
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        You can switch paths later from the dashboard.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.id}
              onClick={() => setMode(o.id)}
              className={cn(
                "group rounded-xl border-2 bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                mode === o.id ? "border-primary shadow-md" : "border-border",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-base font-semibold">{o.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{o.sub}</div>
              {mode === o.id && (
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDataset({
  dataset, setDataset, mode, fileName, setFileName,
}: {
  dataset: Dataset;
  setDataset: (d: Dataset) => void;
  mode: SetupMode;
  fileName: string | null;
  setFileName: (s: string | null) => void;
}) {
  return (
    <div>
      <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        Pick the dataset
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        We already include every wilaya and commune — just choose the version that matches your business.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <DatasetCard
          active={dataset === "58"}
          onClick={() => setDataset("58")}
          title="58 official wilayas"
          sub="The standard Algerian administrative divisions."
          tag="Recommended"
        />
        <DatasetCard
          active={dataset === "68"}
          onClick={() => setDataset("68")}
          title="68 (with delegated)"
          sub="Includes 10 delegated wilayas like Timimoun, Touggourt, El M'Ghair."
        />
      </div>

      {mode === "csv" && (
        <div className="mt-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-8 text-center transition hover:border-primary/40">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <div className="mt-2 text-sm font-medium">
              {fileName ?? "Drop your CSV file or click to browse"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Columns: wilaya_code, home_price, office_price
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function DatasetCard({
  active, onClick, title, sub, tag,
}: { active: boolean; onClick: () => void; title: string; sub: string; tag?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
        active ? "border-primary shadow-md" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <div className="text-base font-semibold">{title}</div>
        {tag && (
          <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {tag}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      {active && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
          <Check className="h-3.5 w-3.5" /> Selected
        </div>
      )}
    </button>
  );
}

function StepWilayas({
  rows, filtered, query, setQuery, toggle, toggleAll, enabledCount,
}: {
  rows: Wilaya[]; filtered: Wilaya[]; query: string; setQuery: (v: string) => void;
  toggle: (c: string) => void; toggleAll: (v: boolean) => void; enabledCount: number;
}) {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pick your wilayas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{enabledCount}</span> of {rows.length} selected.
          Prices stay at sensible defaults — fine-tune later.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wilaya..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>Select all</Button>
        <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>Clear</Button>
      </div>

      <div className="mt-4 grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto rounded-xl border bg-card/40 p-3 sm:grid-cols-3">
        {filtered.map((r) => {
          const active = r.enabled;
          return (
            <button
              key={r.code}
              onClick={() => toggle(r.code)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-left transition",
                active ? "border-primary bg-primary/5" : "border-transparent bg-card hover:border-border",
              )}
            >
              <span className={cn(
                "flex h-6 w-7 shrink-0 items-center justify-center rounded text-[10px] font-mono font-semibold",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {r.code}
              </span>
              <span className="flex-1 truncate text-sm font-medium">{r.nameFr}</span>
              {active && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDone({ enabledCount }: { enabledCount: number }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-success text-success-foreground shadow-lg">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to apply</h2>
      <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
        {enabledCount} wilayas are queued. Review the exact changes before they touch WooCommerce.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <ResultCard label="To create" value="11" />
        <ResultCard label="To update" value="6" />
        <ResultCard label="Skipped" value="2" />
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
