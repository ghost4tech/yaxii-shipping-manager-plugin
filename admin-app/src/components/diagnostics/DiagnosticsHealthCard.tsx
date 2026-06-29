import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiagnosticsHealthCheck } from "@/lib/diagnostics/status";

export function DiagnosticsHealthCard({ check }: { check: DiagnosticsHealthCheck }) {
  const Icon =
    check.status === "ok" ? CheckCircle2 : check.status === "warn" ? AlertTriangle : AlertCircle;
  const toneClass =
    check.status === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
      : check.status === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", toneClass)}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium">{check.label}</div>
          <div className="text-xs text-muted-foreground">{check.detail}</div>
        </div>
      </CardContent>
    </Card>
  );
}
