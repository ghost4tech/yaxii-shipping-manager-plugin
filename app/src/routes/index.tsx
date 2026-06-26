import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Truck, MapPinned, Activity, Sparkles, Download, CheckCircle2,
  AlertTriangle, Zap, Cable,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SETUP_STATUS, COUNTRIES } from "@/lib/mock-data";
import { usePlan } from "@/lib/plan";
import { ProBadge } from "@/components/ProBadge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Yaxii Shipping" }] }),
  component: Dashboard,
});

function Dashboard() {
  const s = SETUP_STATUS;
  const { country, isPro } = usePlan();
  const activeCountry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];
  const completion = Math.round((s.enabledWilayas / s.totalWilayas) * 100);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {activeCountry.flag} {activeCountry.name} · WooCommerce {s.wooVersion}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Your shipping, in one place.
          </h1>
        </div>
        {!isPro && <ProBadge />}
      </div>

      {/* Status hero — single most important action */}
      <section className="mt-8 overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
          <div className="p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Setup status
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight">{completion}%</span>
              <span className="text-sm text-muted-foreground">
                {s.enabledWilayas} of {s.totalWilayas} wilayas configured
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/wizard">
                  <Download className="mr-1.5 h-4 w-4" />
                  Import wilayas
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/manager">
                  Open manager <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column — quick health */}
          <div className="grid grid-cols-2 gap-px border-t bg-border md:border-l md:border-t-0">
            <Tile label="Missing" value={s.missingZones} tone={s.missingZones > 0 ? "warn" : "ok"} icon={AlertTriangle} />
            <Tile label="Duplicates" value={s.duplicates} tone={s.duplicates > 0 ? "warn" : "ok"} icon={Activity} />
            <Tile label="Needs sync" value={s.needsSync} tone={s.needsSync > 0 ? "warn" : "ok"} icon={Cable} />
            <Tile label="Healthy" value={s.enabledWilayas - s.missingZones - s.duplicates} tone="ok" icon={CheckCircle2} />
          </div>
        </div>
      </section>

      {/* Three calm cards: 60/30/10 — neutral cards, single primary accent on hover */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickCard
          to="/wizard"
          eyebrow="Free"
          title="Import"
          sub="Generate WooCommerce zones from the dataset."
          icon={Download}
        />
        <QuickCard
          to="/manager"
          eyebrow={isPro ? "Pro" : "Pro · locked"}
          title="Manage"
          sub="Edit prices, toggle methods, in one screen."
          icon={Truck}
          locked={!isPro}
        />
        <QuickCard
          to="/automations"
          eyebrow={isPro ? "Pro" : "Pro · locked"}
          title="Automate"
          sub="Triggers that keep zones in sync, hands-free."
          icon={Zap}
          locked={!isPro}
        />
      </div>

      {/* Soft pro nudge — single muted block, not noisy */}
      {!isPro && (
        <section className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-transparent p-6 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Tired of the WooCommerce shipping page?</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pro lets you manage every zone, run automations, and keep YSF in sync — without leaving Yaxii.
            </p>
          </div>
          <Button asChild variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100/50">
            <Link to="/products">See what's in Pro</Link>
          </Button>
        </section>
      )}

      {/* Footer hint */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <MapPinned className="h-3 w-3" />
        Dataset for {activeCountry.name} — {activeCountry.wilayaCount} {activeCountry.regionLabel}.
        More countries coming.
      </div>
    </div>
  );
}

function Tile({
  label, value, tone, icon: Icon,
}: { label: string; value: number; tone: "ok" | "warn"; icon: React.ElementType }) {
  const color =
    tone === "warn" && value > 0
      ? "text-warning-foreground"
      : "text-muted-foreground";
  return (
    <div className="flex flex-col gap-1 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function QuickCard({
  to, title, sub, eyebrow, icon: Icon, locked,
}: {
  to: string;
  title: string;
  sub: string;
  eyebrow: string;
  icon: React.ElementType;
  locked?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            locked ? "text-amber-700" : "text-muted-foreground"
          }`}
        >
          {eyebrow}
        </span>
      </div>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}
