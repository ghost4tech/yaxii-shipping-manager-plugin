import { Activity, AlertCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
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
      <DiagnosticsCompatibilityCards response={response} />
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

type CompatibilityCard = {
  id: string;
  title: string;
  copy: string;
  action: string;
};

function DiagnosticsCompatibilityCards({ response }: { response: DiagnosticsResponse }) {
  const cards = compatibilityCards(response);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((card) => (
        <Card key={card.id}>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{card.title}</div>
              <div className="text-xs text-muted-foreground">{card.copy}</div>
              <button
                type="button"
                onClick={scrollToCompatibilityDetails}
                className="mt-2 text-xs font-medium text-primary hover:text-primary/80"
              >
                {card.action}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function compatibilityCards(response: DiagnosticsResponse): CompatibilityCard[] {
  const compatibility = response.compatibility;
  const cards: CompatibilityCard[] = [];

  if (compatibility.yaxiiCodThemeDetected || compatibility.yaxiiCodZoneMapDetected) {
    cards.push({
      id: "yaxii-cod-setup",
      title: "Existing Yaxii COD setup detected",
      copy: "This store has shipping zones created by Yaxii COD Theme. Yaxii Shipping Manager will not edit them automatically.",
      action: "Review advanced details",
    });
  }

  if (compatibility.normalizedDuplicateWilayaCount > 0) {
    cards.push({
      id: "duplicate-zones",
      title: "Duplicate shipping zones found",
      copy: "More than one shipping zone appears to cover the same wilaya using different code formats.",
      action: "Review duplicate zones",
    });
  }

  if (compatibility.stateFormatMismatchDetected) {
    cards.push({
      id: "state-format",
      title: "State code format mismatch",
      copy: "Some zones use the Yaxii COD Theme format DZ-XX, while Yaxii Shipping Manager uses WooCommerce state codes like 01.",
      action: "Review compatibility details",
    });
  }

  if (
    compatibility.checkoutCompatibilityRisk === "medium" ||
    compatibility.checkoutCompatibilityRisk === "high"
  ) {
    cards.push({
      id: "checkout-compatibility",
      title: "Checkout compatibility warning",
      copy: "Yaxii COD Theme checkout may use its own zone map. Yaxii Shipping Manager zones may not power that checkout until a bridge is added.",
      action: "Review details",
    });
  }

  return cards;
}

function scrollToCompatibilityDetails() {
  document.getElementById("ysm-compatibility-details")?.scrollIntoView({
    block: "start",
    behavior: "smooth",
  });
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
