import type { ReactNode } from "react";
import { CheckCircle2, Eye, FileEdit, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { generatorRecommendation } from "@/lib/generator/diagnostics-guidance";
import type { SetupMode } from "@/lib/generator/preview-summary";
import { cn } from "@/lib/utils";
import type { DiagnosticsResponse } from "@/types/diagnostics";

export function GeneratorStartStep({
  mode,
  setMode,
  diagnostics,
}: {
  mode: SetupMode;
  setMode: (mode: SetupMode) => void;
  diagnostics?: DiagnosticsResponse;
}) {
  const recommendation = generatorRecommendation(diagnostics);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
        <ShieldCheck className="h-3 w-3" /> Preview before apply
      </div>
      <h3 className="text-2xl font-semibold tracking-tight">How would you like to start?</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Generator is for setup and repair. Use Shipping Zones for daily price changes.
      </p>
      <Card className="mt-5 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-medium uppercase text-primary">Recommended path</div>
            {recommendation.title === "Setup already active" && (
              <Badge variant="secondary" className="text-[10px]">
                Daily changes live in Shipping Zones
              </Badge>
            )}
          </div>
          <div className="mt-1 text-base font-semibold">{recommendation.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.description}</p>
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StartCard
          active={mode === "fresh"}
          onClick={() => setMode("fresh")}
          icon={<Sparkles className="h-5 w-5" />}
          title="Create new setup"
          desc="Create a new shipping setup for selected wilayas."
        />
        <StartCard
          active={mode === "continue"}
          onClick={() => setMode("continue")}
          icon={<FileEdit className="h-5 w-5" />}
          title="Repair existing setup"
          desc="Fix missing Yaxii-managed zones or methods. Manual zones are not touched."
        />
        <StartCard
          active={mode === "preview"}
          onClick={() => setMode("preview")}
          icon={<Eye className="h-5 w-5" />}
          title="Preview only"
          desc="Review the plan without applying changes."
        />
      </div>
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
