import { Activity, AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  diagnosticsHealthChecks,
  diagnosticsHealthSummary,
  diagnosticsRecommendedAction,
} from "@/lib/diagnostics/status";
import type { DiagnosticsResponse } from "@/types/diagnostics";

import { DiagnosticsAdvancedDetails } from "./DiagnosticsAdvancedDetails";
import { DiagnosticsHealthSummary } from "./DiagnosticsHealthSummary";
import { DiagnosticsRecommendationCard } from "./DiagnosticsRecommendationCard";

export type DiagnosticsLoadState =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "ready"; response: DiagnosticsResponse }
  | { status: "error"; message: string };

export function DiagnosticsPage({
  diagnosticsState,
  onRefresh,
  onOpenShippingZones,
  onOpenGenerator,
}: {
  diagnosticsState: DiagnosticsLoadState;
  onRefresh: () => void;
  onOpenShippingZones: () => void;
  onOpenGenerator: () => void;
}) {
  return (
    <>
      <DiagnosticsHeader loading={diagnosticsState.status === "loading"} onRefresh={onRefresh} />
      {(diagnosticsState.status === "waiting" || diagnosticsState.status === "loading") && (
        <DiagnosticsLoadingState />
      )}
      {diagnosticsState.status === "error" && (
        <DiagnosticsErrorState message={diagnosticsState.message} />
      )}
      {diagnosticsState.status === "ready" && (
        <DiagnosticsReadyState
          response={diagnosticsState.response}
          refreshDisabled={false}
          onRefresh={onRefresh}
          onOpenShippingZones={onOpenShippingZones}
          onOpenGenerator={onOpenGenerator}
        />
      )}
    </>
  );
}

function DiagnosticsHeader({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          <ShieldCheck className="h-3 w-3" /> Read-only health check
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Checkout Protection</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review WooCommerce shipping setup, conflicts, protected zones, and checkout fallback risk.
        </p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        Refresh diagnostics
      </Button>
    </div>
  );
}

function DiagnosticsLoadingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">Running diagnostics...</div>
      </CardContent>
    </Card>
  );
}

function DiagnosticsErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Diagnostics could not be loaded</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function DiagnosticsReadyState({
  response,
  refreshDisabled,
  onRefresh,
  onOpenShippingZones,
  onOpenGenerator,
}: {
  response: DiagnosticsResponse;
  refreshDisabled: boolean;
  onRefresh: () => void;
  onOpenShippingZones: () => void;
  onOpenGenerator: () => void;
}) {
  const checks = useMemo(() => diagnosticsHealthChecks(response), [response]);
  const summary = useMemo(() => diagnosticsHealthSummary(checks), [checks]);
  const recommendation = useMemo(
    () => diagnosticsRecommendedAction(response, summary),
    [response, summary],
  );

  return (
    <div className="space-y-6">
      {response.warnings.length > 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertTitle>Read-only diagnostic warning</AlertTitle>
          <AlertDescription>{response.warnings[0]}</AlertDescription>
        </Alert>
      )}
      <DiagnosticsHealthSummary checks={checks} summary={summary} />
      <DiagnosticsRecommendationCard
        recommendation={recommendation}
        refreshDisabled={refreshDisabled}
        onRefresh={onRefresh}
        onOpenShippingZones={onOpenShippingZones}
        onOpenGenerator={onOpenGenerator}
      />
      <DiagnosticsAdvancedDetails response={response} />
    </div>
  );
}
