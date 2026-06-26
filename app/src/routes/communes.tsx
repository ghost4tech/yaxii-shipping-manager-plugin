import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { COMMUNES, WILAYAS } from "@/lib/mock-data";

export const Route = createFileRoute("/communes")({
  head: () => ({ meta: [{ title: "Communes — Yaxii" }] }),
  component: CommunesPage,
});

function CommunesPage() {
  const [query, setQuery] = useState("");
  const [wilayaCode, setWilayaCode] = useState<string>("all");

  const filtered = useMemo(() => COMMUNES.filter((c) => {
    if (wilayaCode !== "all" && c.wilayaCode !== wilayaCode) return false;
    if (query && !`${c.nameFr} ${c.nameAr} ${c.postalCode}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [query, wilayaCode]);

  return (
    <div className="pb-10">
      <PageHeader
        title="Communes"
        description="Search the full dataset of Algerian communes and postal codes."
        icon={MapPin}
      />

      <div className="space-y-4 px-6 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commune or postal code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <Select value={wilayaCode} onValueChange={setWilayaCode}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Wilaya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wilayas</SelectItem>
              {WILAYAS.map((w) => (
                <SelectItem key={w.code} value={w.code}>{w.code} — {w.nameFr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">
            {filtered.length} communes
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[90px]">Wilaya</TableHead>
                <TableHead>Commune</TableHead>
                <TableHead className="w-[120px]">Postal code</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                    No communes match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const wil = WILAYAS.find((w) => w.code === c.wilayaCode);
                  return (
                    <TableRow key={c.postalCode + c.nameFr}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium">{c.wilayaCode}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{wil?.nameFr}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{c.nameFr}</div>
                        <div dir="rtl" className="text-xs text-muted-foreground">{c.nameAr}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.postalCode}</TableCell>
                      <TableCell>
                        <StatusBadge variant={c.active ? "good" : "neutral"}>
                          {c.active ? "Active" : "Inactive"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
