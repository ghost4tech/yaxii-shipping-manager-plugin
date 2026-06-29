import { Coins, Gift, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MethodDef } from "@/components/generator/types";
import type { ShippingMethodKey } from "@/types/generator";
import type { ShippingZoneFilter, ShippingZoneRowView } from "@/types/shipping-zones";
import { filterCount, SHIPPING_ZONE_FILTERS } from "@/lib/shipping-zones/status";

export function ShippingZonesToolbar({
  rows,
  search,
  filter,
  pendingCount,
  selectedCount,
  protectedSelectionCount,
  targetMethod,
  methodDefs,
  bulkPrice,
  onSearchChange,
  onFilterChange,
  onTargetMethodChange,
  onBulkPriceChange,
  onBulkSetPrice,
  onBulkMakeFree,
  onClearSelection,
}: {
  rows: ShippingZoneRowView[];
  search: string;
  filter: ShippingZoneFilter;
  pendingCount: number;
  selectedCount: number;
  protectedSelectionCount: number;
  targetMethod: ShippingMethodKey;
  methodDefs: MethodDef[];
  bulkPrice: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: ShippingZoneFilter) => void;
  onTargetMethodChange: (method: ShippingMethodKey) => void;
  onBulkPriceChange: (price: string) => void;
  onBulkSetPrice: () => void;
  onBulkMakeFree: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search wilaya or code"
            className="h-9 rounded-md bg-card pl-9 text-sm shadow-none"
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
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-6 items-center rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
              {selectedCount} selected
            </span>
            <span className="text-xs font-medium text-primary">Quick price tools</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                value={targetMethod}
                onValueChange={(value) => onTargetMethodChange(value as ShippingMethodKey)}
              >
                <SelectTrigger className="h-8 w-44 bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methodDefs.slice(0, 2).map((method) => (
                    <SelectItem key={method.key} value={method.key}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={bulkPrice}
                onChange={(event) => onBulkPriceChange(event.target.value)}
                placeholder="Price"
                className="h-8 w-24 bg-card text-xs"
              />
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onBulkSetPrice}>
                <Coins className="h-3.5 w-3.5" />
                Set price
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onBulkMakeFree}>
                <Gift className="h-3.5 w-3.5" />
                Make free
              </Button>
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
