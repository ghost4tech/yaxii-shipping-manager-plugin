import { ArrowRight, Coins, Gift, Search, Sparkles, X } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MethodDef } from "@/components/generator/types";
import type { ShippingMethodKey } from "@/types/generator";
import type { ShippingZoneFilter, ShippingZoneRowView } from "@/types/shipping-zones";
import { filterCount, SHIPPING_ZONE_FILTERS } from "@/lib/shipping-zones/status";

type BulkTarget = ShippingMethodKey | "both";

export function ShippingZonesToolbar({
  rows,
  search,
  filter,
  pendingCount,
  selectedCount,
  protectedSelectionCount,
  bulkTarget,
  methodDefs,
  bulkPrice,
  onSearchChange,
  onFilterChange,
  onBulkTargetChange,
  onBulkPriceChange,
  onBulkSetPrice,
  onBulkMakeFree,
  onClearSelection,
  onReviewChanges,
}: {
  rows: ShippingZoneRowView[];
  search: string;
  filter: ShippingZoneFilter;
  pendingCount: number;
  selectedCount: number;
  protectedSelectionCount: number;
  bulkTarget: BulkTarget;
  methodDefs: MethodDef[];
  bulkPrice: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: ShippingZoneFilter) => void;
  onBulkTargetChange: (method: BulkTarget) => void;
  onBulkPriceChange: (price: string) => void;
  onBulkSetPrice: () => void;
  onBulkMakeFree: () => void;
  onClearSelection: () => void;
  onReviewChanges: () => void;
}) {
  const targetOptions = [
    ...methodDefs
      .slice(0, 2)
      .map((method) => ({ value: method.key as BulkTarget, label: method.label })),
    { value: "both" as const, label: "Both" },
  ];

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search wilaya or code"
            className="h-9 rounded-md border-border bg-card pl-9 text-sm shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SHIPPING_ZONE_FILTERS.map((item) => {
            const active = filter === item.key;
            const count = item.key === "pending" ? pendingCount : filterCount(rows, item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange(item.key)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
                {selectedCount} selected
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Quick tools
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Apply to</span>
              <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                {targetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onBulkTargetChange(option.value)}
                    className={cn(
                      "h-6 rounded px-2.5 text-xs font-medium transition-colors",
                      bulkTarget === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5">
              <Input
                value={bulkPrice}
                onChange={(event) => onBulkPriceChange(event.target.value)}
                placeholder="e.g. 800"
                className="h-6 w-24 border-0 p-0 text-xs shadow-none focus-visible:ring-0"
              />
              <span className="text-xs text-muted-foreground">DZD</span>
            </div>
            <ToolButton icon={Coins} label="Set price" onClick={onBulkSetPrice} />
            <ToolButton icon={Gift} label="Make free" onClick={onBulkMakeFree} />
            {pendingCount > 0 && (
              <ToolButton icon={ArrowRight} label="Review changes" onClick={onReviewChanges} />
            )}
          </div>
          {protectedSelectionCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {protectedSelectionCount} selected row(s) are protected or missing setup and will not
              receive bulk price changes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/10"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
