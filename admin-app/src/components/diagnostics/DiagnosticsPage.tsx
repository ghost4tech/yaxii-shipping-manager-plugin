import { Activity, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useMemo } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  diagnosticsHealthChecks,
  diagnosticsHealthSummary,
  diagnosticsRecommendedAction,
  type DiagnosticsHealthAction,
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
  onOpenWooCommerceZones,
}: {
  diagnosticsState: DiagnosticsLoadState;
  onRefresh: () => void;
  onOpenShippingZones: () => void;
  onOpenGenerator: () => void;
  onOpenWooCommerceZones: () => void;
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
          onOpenWooCommerceZones={onOpenWooCommerceZones}
        />
      )}
    </>
  );
}

function DiagnosticsHeader({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Diagnostics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review shipping setup health.</p>
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
  onOpenWooCommerceZones,
}: {
  response: DiagnosticsResponse;
  refreshDisabled: boolean;
  onRefresh: () => void;
  onOpenShippingZones: () => void;
  onOpenGenerator: () => void;
  onOpenWooCommerceZones: () => void;
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
      <DiagnosticsHealthSummary
        checks={checks}
        summary={summary}
        onAction={(action) =>
          runDiagnosticsAction(action, {
            onOpenShippingZones,
            onOpenGenerator,
            onOpenWooCommerceZones,
          })
        }
      />
      <DiagnosticsRecommendationCard
        recommendation={recommendation}
        refreshDisabled={refreshDisabled}
        onRefresh={onRefresh}
        onOpenShippingZones={onOpenShippingZones}
        onOpenGenerator={onOpenGenerator}
        onOpenWooCommerceZones={onOpenWooCommerceZones}
      />
      <DiagnosticsAdvancedDetails response={response} />
    </div>
  );
}

function runDiagnosticsAction(
  action: DiagnosticsHealthAction,
  handlers: {
    onOpenShippingZones: () => void;
    onOpenGenerator: () => void;
    onOpenWooCommerceZones: () => void;
  },
) {
  if (action === "shipping_zones") {
    handlers.onOpenShippingZones();
    return;
  }

  if (action === "generator") {
    handlers.onOpenGenerator();
    return;
  }

  handlers.onOpenWooCommerceZones();
}
