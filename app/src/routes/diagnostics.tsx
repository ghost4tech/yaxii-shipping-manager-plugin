import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Play, Loader2, Stethoscope, CheckCircle2, AlertTriangle, XCircle, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { DIAGNOSTICS, WILAYAS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostics")({
  head: () => ({ meta: [{ title: "Diagnostics — Yaxii" }] }),
  component: DiagnosticsPage,
});

const sevMap = {
  good: { icon: CheckCircle2, label: "Good", className: "text-success bg-success/10 border-success/20" },
  warning: { icon: AlertTriangle, label: "Warning", className: "text-warning-foreground bg-warning/15 border-warning/30" },
  critical: { icon: XCircle, label: "Critical", className: "text-destructive bg-destructive/10 border-destructive/20" },
} as const;

function DiagnosticsPage() {
  const [loading, setLoading] = useState(false);
  const [testCode, setTestCode] = useState<string>("16");
  const [testResult, setTestResult] = useState<null | {
    ok: boolean;
    methods: string[];
    note: string;
  }>(null);

  const run = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1100);
  };

  const runTest = () => {
    const w = WILAYAS.find((x) => x.code === testCode);
    if (!w) return;
    const ok = w.enabled && (w.wooStatus === "managed" || w.wooStatus === "changed");
    setTestResult({
      ok,
      methods: ok
        ? [
            ...(w.homeEnabled ? [`Home delivery — ${w.homePrice} DZD`] : []),
            ...(w.officeEnabled ? [`Stop desk — ${w.officePrice} DZD`] : []),
          ]
        : [],
      note: ok
        ? "Checkout will show shipping options for this wilaya."
        : w.wooStatus === "missing"
          ? "No shipping zone exists. Customers won't see a method — they may get blocked at checkout."
          : "Zone exists but is not active or has conflicts. Review in the manager.",
    });
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Diagnostics"
        description="Verify WooCommerce shipping health and simulate a real customer checkout."
        icon={Stethoscope}
        actions={
          <Button onClick={run} disabled={loading} variant="outline">
            {loading
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Checking…</>
              : <><Play className="mr-1.5 h-4 w-4" /> Run check</>}
          </Button>
        }
      />

      <div className="space-y-6 px-6 pt-5">
        {/* Test address checker */}
        <section className="rounded-xl border bg-card">
          <header className="flex items-center gap-2 border-b px-5 py-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Simulate a checkout</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              See exactly what a customer would see.
            </span>
          </header>
          <div className="flex flex-wrap items-end gap-3 p-5">
            <div className="w-72">
              <label className="block text-xs font-medium text-muted-foreground">
                Test wilaya
              </label>
              <Select value={testCode} onValueChange={setTestCode}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.code} — {w.nameFr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runTest}>
              <Play className="mr-1.5 h-4 w-4" /> Run test
            </Button>

            {testResult && (
              <div className="w-full">
                <div className={cn(
                  "mt-3 rounded-md border p-4",
                  testResult.ok ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5",
                )}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {testResult.ok
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <XCircle className="h-4 w-4 text-destructive" />}
                    {testResult.ok ? "Shipping methods would appear" : "No shipping methods would appear"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{testResult.note}</p>
                  {testResult.methods.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {testResult.methods.map((m) => (
                        <li key={m} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Diagnostics list */}
        <section className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">System checks</h2>
            <span className="text-xs text-muted-foreground">{DIAGNOSTICS.length} checks</span>
          </header>
          <ul className="divide-y">
            {(loading ? Array.from({ length: 6 }, () => null) : DIAGNOSTICS).map((d, idx) => {
              if (!d) {
                return (
                  <li key={idx} className="px-5 py-4">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
                  </li>
                );
              }
              const sev = sevMap[d.severity];
              const Icon = sev.icon;
              return (
                <li key={d.label} className="flex items-start gap-3 px-5 py-4">
                  <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", sev.className)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{d.label}</div>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium border", sev.className)}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>
                    {d.fix && (
                      <p className="mt-1 text-xs font-medium text-primary">→ {d.fix}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
