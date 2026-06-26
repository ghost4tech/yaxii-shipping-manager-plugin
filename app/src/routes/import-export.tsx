import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Download, FileCheck2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ProLock, ProInline } from "@/components/ProLock";
import { toast } from "sonner";

export const Route = createFileRoute("/import-export")({
  head: () => ({ meta: [{ title: "Import & export — Yaxii" }] }),
  component: ImportExportPage,
});

function ImportExportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  return (
    <div className="pb-10">
      <PageHeader
        title="Import &amp; export"
        description="Move your shipping configuration in or out as CSV / JSON."
        icon={FileUp}
      />

      <div className="grid gap-4 px-6 pt-5 lg:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <header className="border-b px-5 py-3">
            <h3 className="text-sm font-semibold">Import CSV</h3>
            <p className="text-xs text-muted-foreground">
              Columns: wilaya_code, home_price, office_price, home_enabled, office_enabled
            </p>
          </header>
          <div className="p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/20 p-10 text-center transition hover:bg-muted/40 hover:border-primary/40">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">{fileName ?? "Drop CSV or click to browse"}</div>
              <div className="mt-1 text-xs text-muted-foreground">Max 2 MB</div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFileName(f.name); setValidated(false); }
                }}
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Sample CSV
              </Button>
              <Button
                size="sm"
                disabled={!fileName}
                onClick={() => { setValidated(true); toast.success("File validated"); }}
              >
                <FileCheck2 className="mr-1.5 h-3.5 w-3.5" /> Validate
              </Button>
            </div>

            {validated && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Valid rows" value="48" variant="good" />
                <Stat label="Invalid rows" value="2" variant="critical" />
                <Stat label="Missing prices" value="3" variant="warning" />
                <Stat label="Unknown codes" value="1" variant="warning" />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold">Export</h3>
              <p className="text-xs text-muted-foreground">Take your config with you.</p>
            </div>
            <ProInline label="Export" />
          </header>
          <div className="space-y-2 p-5">
            <ProLock feature="Export is Pro" description="CSV, JSON, and PDF exports require Pro." compact>
              <div className="space-y-2">
                <ExportRow title="Current table" sub="Wilaya prices, toggles, statuses" tag="CSV" />
                <ExportRow title="WooCommerce zones snapshot" sub="Everything currently in Woo" tag="JSON" />
                <ExportRow title="Diagnostics report" sub="Latest health-check results" tag="PDF" />
              </div>
            </ProLock>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, variant }: { label: string; value: string; variant: "good" | "warning" | "critical" }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1">
        <StatusBadge variant={variant}>{value}</StatusBadge>
      </div>
    </div>
  );
}

function ExportRow({ title, sub, tag }: { title: string; sub: string; tag: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-md border bg-card p-3 text-left transition hover:border-primary/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
        <Download className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
    </button>
  );
}
