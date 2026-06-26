import { createFileRoute } from "@tanstack/react-router";
import { Lock, Cable, ArrowRightLeft, Download, Settings2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ysf-sync")({
  head: () => ({ meta: [{ title: "YSF sync — Yaxii" }] }),
  component: YsfPage,
});

const modes = [
  {
    id: "manual",
    icon: Settings2,
    title: "Manual mode",
    sub: "You manage shipping zones directly in Yaxii Shipping Zones. WooCommerce checkout uses Woo zones only. (Current mode)",
    active: true,
  },
  {
    id: "import",
    icon: Download,
    title: "Import from YSF",
    sub: "One-time copy of YSF shipping prices into WooCommerce zones. Future updates stay manual.",
    active: false,
  },
  {
    id: "sync",
    icon: ArrowRightLeft,
    title: "Sync from YSF",
    sub: "YSF Shipping Manager becomes the source of truth and continuously mirrors fallback shipping methods into WooCommerce checkout.",
    active: false,
  },
];

function YsfPage() {
  return (
    <div className="pb-10">
      <PageHeader
        title="YSF sync"
        description="Connect Yaxii Smart Form so it can drive WooCommerce shipping at checkout."
        icon={Cable}
      />

      <div className="space-y-4 px-6 pt-5">
        <section className="flex items-center gap-4 rounded-xl border bg-card p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            <Cable className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Yaxii Smart Form</div>
            <div className="text-xs text-muted-foreground">
              Not detected on this site. Install YSF to unlock import and sync modes.
            </div>
          </div>
          <StatusBadge variant="neutral">Not detected</StatusBadge>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="text-sm font-semibold">Why this matters</div>
          <p className="mt-1 text-sm text-muted-foreground">
            When YSF is installed, the YSF Shipping Manager can become the single source of truth for shipping pricing.
            Yaxii will mirror those rules into WooCommerce so the standard Woo checkout always has a working shipping
            fallback — even if your customers switch from YSF to the native cart flow.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Available modes</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "relative rounded-xl border bg-card p-5",
                    m.active ? "border-primary/40" : "opacity-70",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    {m.active ? (
                      <StatusBadge variant="primary" className="ml-auto">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="neutral" className="ml-auto">
                        <Lock className="h-3 w-3" /> Coming soon
                      </StatusBadge>
                    )}
                  </div>
                  <div className="mt-3 text-sm font-semibold">{m.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{m.sub}</p>
                  <Button
                    variant={m.active ? "outline" : "secondary"}
                    size="sm"
                    disabled={!m.active}
                    className="mt-4 w-full"
                  >
                    {m.active ? "Currently in use" : "Unlock with YSF"}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
