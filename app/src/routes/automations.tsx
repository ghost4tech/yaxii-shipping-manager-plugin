import { createFileRoute } from "@tanstack/react-router";
import { Zap, Plus, Play, Pause, Sparkles, Calendar, Bell, RefreshCw, Cable, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AUTOMATIONS } from "@/lib/mock-data";
import { usePlan } from "@/lib/plan";
import { ProLock, ProInline } from "@/components/ProLock";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/automations")({
  head: () => ({ meta: [{ title: "Automations — Yaxii" }] }),
  component: AutomationsPage,
});

const TEMPLATES = [
  { icon: RefreshCw, title: "Auto-import new wilayas", sub: "When dataset updates, create the zone." },
  { icon: Cable, title: "Sync from YSF", sub: "Mirror YSF prices into WooCommerce." },
  { icon: Calendar, title: "Schedule price changes", sub: "Run a bulk update on a calendar." },
  { icon: Bell, title: "Alert on conflicts", sub: "Notify when duplicates appear." },
  { icon: AlertTriangle, title: "Stock-based zones", sub: "Disable shipping where stock = 0." },
];

function AutomationsPage() {
  return (
    <ProLock
      feature="Automations are a Pro feature"
      description="Set rules once. Yaxii keeps your shipping zones up to date automatically."
    >
      <AutomationsContent />
    </ProLock>
  );
}

function AutomationsContent() {
  const { isPro } = usePlan();
  const [rules, setRules] = useState(AUTOMATIONS);

  const toggle = (id: string) => setRules((rs) =>
    rs.map((r) => r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r),
  );

  return (
    <div className="pb-10">
      <div className="border-b bg-card/50 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Automations
            </div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
              Run on autopilot
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Trigger → action. Yaxii will do the work in the background.
            </p>
          </div>
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> New automation
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-6 pt-6">
        {/* Templates */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Start from a template</h2>
            <span className="text-xs text-muted-foreground">{TEMPLATES.length} templates</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.title}
                  onClick={() => toast.success(`${t.title} added`)}
                  className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary/40"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.sub}</p>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-foreground" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Active rules */}
        <section>
          <h2 className="mb-2 text-sm font-semibold">Your automations</h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    r.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                  )}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.name}</span>
                      {r.isPro && !isPro && <ProInline />}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">When</span> {r.trigger}
                      <span className="mx-1.5 text-muted-foreground/40">→</span>
                      <span className="font-medium text-foreground">Do</span> {r.action}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">{r.runs} runs</span>
                    <span className={cn(
                      "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                      r.status === "active" && "border-success/30 bg-success/10 text-success",
                      r.status === "paused" && "border-border bg-muted text-muted-foreground",
                      r.status === "draft" && "border-amber-300/60 bg-amber-50 text-amber-700",
                    )}>
                      {r.status}
                    </span>
                    {r.status !== "draft" && (
                      <Switch
                        checked={r.status === "active"}
                        onCheckedChange={() => toggle(r.id)}
                        className="scale-90"
                      />
                    )}
                    {r.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-7">
                        <Play className="mr-1 h-3 w-3" /> Activate
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

void Pause; void Sparkles;
