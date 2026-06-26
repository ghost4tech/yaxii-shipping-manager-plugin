import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye, Plus, RefreshCw, Truck, AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ProLock, ProInline } from "@/components/ProLock";
import { usePlan } from "@/lib/plan";
import { PREVIEW_CHANGES } from "@/lib/mock-data";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [{ title: "Preview changes — Yaxii" }] }),
  component: () => (
    <ProLock
      feature="Preview & apply is Pro"
      description="Free covers import. Pro shows a precise diff and lets you push safely to WooCommerce."
    >
      <PreviewPage />
    </ProLock>
  ),
});

function PreviewPage() {
  const navigate = useNavigate();
  const { isPro } = usePlan();
  const [cleanup, setCleanup] = useState(false);
  const [open, setOpen] = useState(false);
  const c = PREVIEW_CHANGES;

  return (
    <div className="pb-10">
      <PageHeader
        title="Preview &amp; apply"
        description="Review every change before it's written to WooCommerce."
        icon={Eye}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/manager">Back to manager</Link>
            </Button>
            <Button onClick={() => setOpen(true)}>
              Apply changes <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      <div className="space-y-4 px-6 pt-5">
        {/* Safety banner */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm">
            <div className="font-medium">Safe by default</div>
            <p className="mt-0.5 text-muted-foreground">
              Only zones created by Yaxii Shipping Zones will be updated. Manual WooCommerce zones are <span className="font-medium text-foreground">not touched</span> unless cleanup mode is enabled.
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Switch
                checked={cleanup && isPro}
                onCheckedChange={(v) => isPro ? setCleanup(v) : toast.info("Cleanup mode is Pro")}
                disabled={!isPro}
              />
              <span>Enable cleanup mode</span>
              {!isPro ? <ProInline label="Cleanup mode" /> : (
                <span className="text-xs text-muted-foreground">(will overwrite conflicting manual zones)</span>
              )}
              {!isPro && <Lock className="h-3 w-3 text-amber-600" />}
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryTile label="To create" value={c.toCreate.length} icon={Plus} tone="primary" />
          <SummaryTile label="To update" value={c.toUpdate.length} icon={RefreshCw} tone="info" />
          <SummaryTile label="Conflicts" value={c.conflicts.length} icon={AlertTriangle} tone="warning" />
          <SummaryTile label="Skipped" value={c.skipped.length} icon={ShieldCheck} tone="neutral" />
        </div>

        <Section title="Zones to create" subtitle="New WooCommerce shipping zones will be added." items={c.toCreate.map((x) => ({
          left: x.code, title: x.nameFr, right: <StatusBadge variant="primary">Create</StatusBadge>,
        }))} />

        <Section title="Zones to update" subtitle="Existing Yaxii-managed zones with new values." items={c.toUpdate.map((x) => ({
          left: x.code, title: x.nameFr, sub: x.change, right: <StatusBadge variant="info">Update</StatusBadge>,
        }))} />

        <Section title="Methods to add" subtitle="Shipping methods to attach to existing zones." items={c.methodsToAdd.map((x) => ({
          left: x.code, title: x.nameFr, sub: `New method: ${x.method}`, right: <StatusBadge variant="good">Add method</StatusBadge>,
        }))} />

        <Section title="Conflicts" subtitle="A manual zone exists for the same region." items={c.conflicts.map((x) => ({
          left: x.code, title: x.nameFr, sub: x.reason, right: <StatusBadge variant="warning">Conflict</StatusBadge>,
        }))} />

        <Section title="Skipped manual zones" subtitle="Left untouched because cleanup mode is off." items={c.skipped.map((x) => ({
          left: x.code, title: x.nameFr, sub: x.reason, right: <StatusBadge variant="neutral">Skipped</StatusBadge>,
        }))} />
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply changes to WooCommerce?</AlertDialogTitle>
            <AlertDialogDescription>
              {c.toCreate.length} zones will be created, {c.toUpdate.length} updated, and {c.methodsToAdd.length} methods added.
              {cleanup ? " Cleanup mode is ON — conflicting manual zones will be replaced." : " Cleanup mode is OFF — manual zones will be skipped."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                toast.success("Changes applied to WooCommerce");
                setTimeout(() => navigate({ to: "/manager" }), 400);
              }}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Apply now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryTile({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: React.ElementType; tone: "primary" | "info" | "warning" | "neutral" }) {
  const colors = {
    primary: "text-primary",
    info: "text-foreground",
    warning: "text-warning-foreground",
    neutral: "text-muted-foreground",
  } as const;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${colors[tone]}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Section({
  title, subtitle, items,
}: {
  title: string;
  subtitle: string;
  items: { left: string; title: string; sub?: string; right: React.ReactNode }[];
}) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-6 text-sm text-muted-foreground">Nothing here.</div>
      ) : (
        <ul className="divide-y">
          {items.map((it, i) => (
            <li key={`${it.left}-${i}`} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-7 w-9 items-center justify-center rounded bg-muted font-mono text-[11px] font-semibold">
                {it.left}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{it.title}</div>
                {it.sub && <div className="text-xs text-muted-foreground">{it.sub}</div>}
              </div>
              {it.right}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

void Truck;
