import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Save, Undo2, Eye, Home, Building2, ChevronDown, ChevronUp,
  Sparkles, Download, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { WILAYAS, type Wilaya, type WooStatus } from "@/lib/mock-data";
import { usePlan } from "@/lib/plan";
import { ProLock, ProInline } from "@/components/ProLock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Shipping manager — Yaxii" }] }),
  component: ManagerPage,
});

const STATUS: Record<WooStatus, { label: string; dot: string }> = {
  managed: { label: "Synced", dot: "bg-success" },
  missing: { label: "Missing", dot: "bg-destructive" },
  manual: { label: "Manual", dot: "bg-muted-foreground/50" },
  duplicate: { label: "Duplicate", dot: "bg-warning" },
  changed: { label: "Edited", dot: "bg-primary" },
  needs_sync: { label: "Out of sync", dot: "bg-warning" },
};

const FILTERS = [
  { id: "all", label: "All wilayas" },
  { id: "enabled", label: "Enabled" },
  { id: "missing", label: "Missing" },
  { id: "duplicate", label: "Duplicates" },
  { id: "needs_sync", label: "Out of sync" },
];

function ManagerPage() {
  return (
    <div>
      <ProLock
        feature="Managing zones is a Pro feature"
        description="Import is free. Pro unlocks inline price editing, bulk actions, and one-click sync to WooCommerce."
      >
        <ManagerContent />
      </ProLock>
    </div>
  );
}

function ManagerContent() {
  const { isPro } = usePlan();
  const [rows, setRows] = useState<Wilaya[]>(WILAYAS);
  const [original] = useState<Wilaya[]>(WILAYAS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sortBy, setSortBy] = useState<{ key: keyof Wilaya; dir: "asc" | "desc" }>({ key: "code", dir: "asc" });

  const dirty = JSON.stringify(rows) !== JSON.stringify(original);
  const changedCount = rows.filter(
    (r, i) => JSON.stringify(r) !== JSON.stringify(original[i]),
  ).length;

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      if (query && !`${r.nameFr} ${r.nameAr} ${r.code}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "enabled" && !r.enabled) return false;
      if (filter !== "all" && filter !== "enabled" && r.wooStatus !== filter) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      const av = a[sortBy.key] as string | number;
      const bv = b[sortBy.key] as string | number;
      if (av < bv) return sortBy.dir === "asc" ? -1 : 1;
      if (av > bv) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, query, filter, sortBy]);

  const update = (code: string, patch: Partial<Wilaya>) =>
    setRows((rs) => rs.map((r) =>
      r.code === code
        ? { ...r, ...patch, wooStatus: r.wooStatus === "managed" ? "changed" : r.wooStatus }
        : r,
    ));

  const toggleSort = (key: keyof Wilaya) => {
    setSortBy((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  const allOnPage = filtered.length > 0 && filtered.every((r) => selected.has(r.code));
  const toggleAllOnPage = () => {
    const next = new Set(selected);
    if (allOnPage) filtered.forEach((r) => next.delete(r.code));
    else filtered.forEach((r) => next.add(r.code));
    setSelected(next);
  };

  return (
    <div className="pb-32">
      {/* Custom thin header — not a generic PageHeader */}
      <div className="border-b bg-card/50 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Shipping manager
            </div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
              {rows.length} wilayas
              <span className="ml-2 text-base font-normal text-muted-foreground">
                · {rows.filter((r) => r.enabled).length} active
              </span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/preview">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/wizard">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Add wilayas
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 pt-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search wilaya or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
            <Filter className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium transition",
                  filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {selected.size > 0 && (
              <BulkBar
                count={selected.size}
                isPro={isPro}
                onClear={() => setSelected(new Set())}
              />
            )}
            <span>{filtered.length} of {rows.length}</span>
          </div>
        </div>

        {/* Table — custom layout, not the generic <Table> */}
        <div className="overflow-hidden rounded-xl border bg-card">
          {/* Head */}
          <div className="grid grid-cols-[36px_70px_minmax(180px,1.4fr)_180px_180px_120px_60px] items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Checkbox
              checked={allOnPage}
              onCheckedChange={toggleAllOnPage}
              className="h-3.5 w-3.5"
            />
            <SortHead label="Code" active={sortBy.key === "code"} dir={sortBy.dir} onClick={() => toggleSort("code")} />
            <SortHead label="Wilaya" active={sortBy.key === "nameFr"} dir={sortBy.dir} onClick={() => toggleSort("nameFr")} />
            <div className="flex items-center gap-1.5"><Home className="h-3 w-3" /> Home</div>
            <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Stop desk</div>
            <div>Status</div>
            <div className="text-right">On</div>
          </div>

          {/* Body */}
          {filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              No wilayas match your filters.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => (
                <li
                  key={r.code}
                  className={cn(
                    "group grid grid-cols-[36px_70px_minmax(180px,1.4fr)_180px_180px_120px_60px] items-center gap-3 px-4 py-2.5 transition hover:bg-muted/40",
                    !r.enabled && "opacity-60",
                    selected.has(r.code) && "bg-primary/5",
                  )}
                >
                  <Checkbox
                    checked={selected.has(r.code)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      v ? next.add(r.code) : next.delete(r.code);
                      setSelected(next);
                    }}
                    className="h-3.5 w-3.5"
                  />
                  <span className="font-mono text-xs font-semibold text-muted-foreground">{r.code}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.nameFr}</div>
                    <div dir="rtl" className="truncate text-[11px] text-muted-foreground">{r.nameAr}</div>
                  </div>
                  <PriceCell
                    value={r.homePrice}
                    onChange={(v) => update(r.code, { homePrice: v })}
                    enabled={r.homeEnabled}
                    onToggle={(v) => update(r.code, { homeEnabled: v })}
                  />
                  <PriceCell
                    value={r.officePrice}
                    onChange={(v) => update(r.code, { officePrice: v })}
                    enabled={r.officeEnabled}
                    onToggle={(v) => update(r.code, { officeEnabled: v })}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS[r.wooStatus].dot)} />
                    <span className="text-xs">{STATUS[r.wooStatus].label}</span>
                  </div>
                  <div className="flex justify-end">
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={(v) => update(r.code, { enabled: v })}
                      className="scale-90"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint with pro upsell for per-method pricing */}
        {!isPro && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-card/50 px-4 py-2.5 text-xs text-muted-foreground">
            <span>Need per-method rules (free shipping over X, weight-based, region groups)?</span>
            <ProInline label="Per-method pricing" />
          </div>
        )}
      </div>

      {/* Dirty bar */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pop">
          <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {changedCount}
            </span>
            <span className="text-sm text-muted-foreground">unsaved {changedCount === 1 ? "change" : "changes"}</span>
            <Button variant="ghost" size="sm" onClick={() => setRows(original)}>
              <Undo2 className="mr-1 h-3.5 w-3.5" /> Discard
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/preview">
                <Eye className="mr-1 h-3.5 w-3.5" /> Preview
              </Link>
            </Button>
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              <Save className="mr-1 h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save these changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Only Yaxii-managed zones will be updated. Manual WooCommerce zones are not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOpen(false); toast.success("Changes saved"); }}>
              Save changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortHead({ label, active, dir, onClick }: {
  label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-left hover:text-foreground">
      {label}
      {active && (dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
  );
}

function PriceCell({
  value, onChange, enabled, onToggle,
}: {
  value: number; onChange: (v: number) => void; enabled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
      <div className={cn(
        "group/price flex items-center rounded-md border bg-card transition focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
        !enabled && "opacity-40",
      )}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={!enabled}
          className="w-16 bg-transparent px-2 py-1 text-right text-xs tabular-nums outline-none disabled:cursor-not-allowed"
        />
        <span className="border-l px-1.5 py-1 text-[10px] font-medium text-muted-foreground">DZD</span>
      </div>
    </div>
  );
}

function BulkBar({ count, isPro, onClear }: { count: number; isPro: boolean; onClear: () => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-primary/5 px-2 py-1 text-foreground">
      <span className="text-xs font-medium">{count} selected</span>
      <Button
        variant="ghost" size="sm" className="h-6 px-2 text-xs"
        disabled={!isPro}
        onClick={() => isPro ? toast.success("Bulk edited") : toast.info("Bulk edit is Pro")}
      >
        Bulk edit {!isPro && <ProInline label="Bulk edit" />}
      </Button>
      <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
        Clear
      </button>
    </div>
  );
}

void Sparkles;
