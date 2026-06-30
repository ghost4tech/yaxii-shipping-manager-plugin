import type { ReactNode } from "react";
import { CheckCircle2, ExternalLink, FileEdit, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generatorStartGuidance } from "@/lib/generator/diagnostics-guidance";
import type { SetupMode } from "@/lib/generator/preview-summary";
import { cn } from "@/lib/utils";
import type { DiagnosticsResponse } from "@/types/diagnostics";

export function GeneratorStartStep({
  mode,
  setMode,
  diagnostics,
  onAdvance,
  onOpenShippingZones,
  onOpenDiagnostics,
  onOpenWooCommerceZones,
}: {
  mode: SetupMode;
  setMode: (mode: SetupMode) => void;
  diagnostics?: DiagnosticsResponse;
  onAdvance: () => void;
  onOpenShippingZones: () => void;
  onOpenDiagnostics: () => void;
  onOpenWooCommerceZones: () => void;
}) {
  const guidance = generatorStartGuidance(diagnostics);
  const startPreviewOnly = () => {
    setMode("preview");
    onAdvance();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
        <ShieldCheck className="h-3 w-3" /> Preview before apply
      </div>
      <h3 className="text-2xl font-semibold tracking-tight">How would you like to start?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Generator is for setup and repair. Use Shipping Editor for daily price changes.
      </p>
      <Card className="mt-5 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-medium uppercase text-primary">Current setup</div>
            {guidance.state === "setup_active" && (
              <Badge variant="secondary" className="text-[10px]">
                Daily changes live in Shipping Editor
              </Badge>
            )}
          </div>
          <div className="mt-1 text-base font-semibold">{guidance.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{guidance.message}</p>
          <StartActions
            guidance={guidance}
            setMode={setMode}
            onAdvance={onAdvance}
            onOpenShippingZones={onOpenShippingZones}
            onOpenDiagnostics={onOpenDiagnostics}
            onOpenWooCommerceZones={onOpenWooCommerceZones}
          />
          {guidance.manualProtectedZoneCount > 0 && guidance.state === "fresh_setup" && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Manual WooCommerce zones exist and will be protected.
            </div>
          )}
        </CardContent>
      </Card>
      {(guidance.state === "diagnostics_unavailable" || guidance.state === "fresh_setup") && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StartCard
            active={mode === "fresh"}
            onClick={() => setMode("fresh")}
            icon={<Sparkles className="h-5 w-5" />}
            title="Create new setup"
            desc="Create a new shipping setup for selected wilayas."
          />
        </div>
      )}
      {guidance.state === "repair_needed" && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StartCard
            active={mode === "continue"}
            onClick={() => setMode("continue")}
            icon={<FileEdit className="h-5 w-5" />}
            title="Repair existing setup"
            desc="Fix missing Yaxii-managed zones or methods. Manual zones are not touched."
          />
        </div>
      )}
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <button
          type="button"
          onClick={startPreviewOnly}
          className="text-left text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Preview only
        </button>
        <p className="mt-1 text-xs text-muted-foreground">
          Review a plan without applying changes.
        </p>
      </div>
    </div>
  );
}

function StartActions({
  guidance,
  setMode,
  onAdvance,
  onOpenShippingZones,
  onOpenDiagnostics,
  onOpenWooCommerceZones,
}: {
  guidance: ReturnType<typeof generatorStartGuidance>;
  setMode: (mode: SetupMode) => void;
  onAdvance: () => void;
  onOpenShippingZones: () => void;
  onOpenDiagnostics: () => void;
  onOpenWooCommerceZones: () => void;
}) {
  const state = guidance.state;
  const startMode = (mode: SetupMode) => {
    setMode(mode);
    onAdvance();
  };

  if (state === "setup_active") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onOpenShippingZones}>
          Open Shipping Editor
        </Button>
        <Button type="button" variant="outline" onClick={() => startMode("fresh")}>
          Modify setup anyway
        </Button>
      </div>
    );
  }

  if (state === "manual_review") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onOpenDiagnostics}>
          Review Diagnostics
        </Button>
        <Button type="button" variant="outline" onClick={onOpenWooCommerceZones}>
          <ExternalLink className="h-4 w-4" />
          Open WooCommerce zones
        </Button>
      </div>
    );
  }

  if (state === "repair_needed") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => startMode("continue")}>
          Repair setup
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" onClick={() => startMode("fresh")}>
        Start setup
      </Button>
      {guidance.manualProtectedZoneCount > 0 && (
        <Button type="button" variant="outline" onClick={onOpenDiagnostics}>
          Review manual zones
        </Button>
      )}
    </div>
  );
}

function StartCard({
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
        "group relative overflow-hidden rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40",
      )}
    >
      <div
        className={cn(
          "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground group-hover:bg-primary/10 group-hover:text-primary",
        )}
      >
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      {active && (
        <div className="absolute right-3 top-3 text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}
