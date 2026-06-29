import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  DiagnosticsHealthCheck,
  DiagnosticsHealthSummary as DiagnosticsHealthSummaryModel,
  DiagnosticsHealthTone,
} from "@/lib/diagnostics/status";

import { DiagnosticsHealthCard } from "./DiagnosticsHealthCard";

export function DiagnosticsHealthSummary({
  checks,
  summary,
}: {
  checks: DiagnosticsHealthCheck[];
  summary: DiagnosticsHealthSummaryModel;
}) {
  const Icon = summary.overallStatus === "ok" ? ShieldCheck : AlertTriangle;

  return (
    <div className="space-y-4">
      <Card className="border-primary/15">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border",
                toneClass(summary.overallStatus),
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">{summary.title}</div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{summary.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Diagnostics are read-only and do not replace a real checkout test.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryStat label="Passed" value={summary.passed} tone="ok" />
        <SummaryStat label="Warnings" value={summary.warnings} tone="warn" />
        <SummaryStat label="Failures" value={summary.failures} tone="fail" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <DiagnosticsHealthCard key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: DiagnosticsHealthTone;
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

function toneClass(tone: DiagnosticsHealthTone): string {
  if (tone === "ok") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  if (tone === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}
