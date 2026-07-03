import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Coins,
  Copy,
  Gift,
  Percent,
  Plus,
  Power,
  RotateCcw,
  Search,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ShippingMethodKey } from "@/types/generator";
import type {
  ShippingZoneFilter,
  ShippingZoneQuickTool,
  ShippingZoneRowView,
} from "@/types/shipping-zones";
import { filterCount, SHIPPING_ZONE_FILTERS } from "@/lib/shipping-zones/status";

type MethodTarget = ShippingMethodKey | "all";
type ToolbarMethodTarget = { key: ShippingMethodKey; label: string };

export function ShippingZonesToolbar({
  rows,
  search,
  filter,
  pendingCount,
  selectedCount,
  editableSelectionCount,
  statusSelectionCount,
  repairableSelectionCount,
  protectedSelectionCount,
  targetMethods,
  onSearchChange,
  onFilterChange,
  onRunQuickTool,
  onClearSelection,
  onReviewChanges,
  onRepairSelected,
}: {
  rows: ShippingZoneRowView[];
  search: string;
  filter: ShippingZoneFilter;
  pendingCount: number;
  selectedCount: number;
  editableSelectionCount: number;
  statusSelectionCount: number;
  repairableSelectionCount: number;
  protectedSelectionCount: number;
  targetMethods: ToolbarMethodTarget[];
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: ShippingZoneFilter) => void;
  onRunQuickTool: (tool: ShippingZoneQuickTool, target: MethodTarget) => void;
  onClearSelection: () => void;
  onReviewChanges: () => void;
  onRepairSelected: () => void;
}) {
  const homeMethod = targetMethods.find((method) => method.key === "home_delivery");
  const officeMethod = targetMethods.find((method) => method.key === "office_delivery");
  const [bulkTarget, setBulkTarget] = useState<MethodTarget>("all");
  const targetOptions: Array<{ value: MethodTarget; label: string }> = [
    { value: "all", label: "All" },
    ...targetMethods.map((method) => ({ value: method.key, label: method.label })),
  ];
  const canCopyBetweenMethods = Boolean(homeMethod && officeMethod);
  const hasEditableSelection = editableSelectionCount > 0;
  const hasStatusSelection = statusSelectionCount > 0;
  const hasRepairableSelection = repairableSelectionCount > 0;

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
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground">
                {selectedCount} selected
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                Quick tools
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {(hasEditableSelection || hasStatusSelection) && (
                <>
                  <span className="text-xs text-muted-foreground">Apply to</span>
                  <Segmented value={bulkTarget} onChange={setBulkTarget} options={targetOptions} />
                </>
              )}
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
            {hasEditableSelection && (
              <>
                <SetPriceTool
                  onApply={(value) => onRunQuickTool({ kind: "set", value }, bulkTarget)}
                />
                <PercentTool
                  onApply={(value) => onRunQuickTool({ kind: "percent", value }, bulkTarget)}
                />
                <AmountTool
                  onApply={(value) => onRunQuickTool({ kind: "amount", value }, bulkTarget)}
                />
                <RoundTool
                  onApply={(nearest) => onRunQuickTool({ kind: "round", nearest }, bulkTarget)}
                />
                <ToolButton
                  icon={Gift}
                  label="Make free"
                  onClick={() => onRunQuickTool({ kind: "free" }, bulkTarget)}
                />
                <ToolButton
                  icon={Copy}
                  label="Copy Home -> Office"
                  disabled={!canCopyBetweenMethods}
                  onClick={() => {
                    if (homeMethod && officeMethod) {
                      onRunQuickTool(
                        { kind: "copy", from: homeMethod.key, to: officeMethod.key },
                        bulkTarget,
                      );
                    }
                  }}
                />
                <ToolButton
                  icon={ArrowLeftRight}
                  label="Copy Office -> Home"
                  disabled={!canCopyBetweenMethods}
                  onClick={() => {
                    if (homeMethod && officeMethod) {
                      onRunQuickTool(
                        { kind: "copy", from: officeMethod.key, to: homeMethod.key },
                        bulkTarget,
                      );
                    }
                  }}
                />
                <ToolButton
                  icon={RotateCcw}
                  label="Discard pending"
                  onClick={() => onRunQuickTool({ kind: "reset" }, bulkTarget)}
                />
              </>
            )}
            {hasStatusSelection && (
              <>
                <div className="mx-1 h-6 w-px self-center bg-primary/15" />
                <ToolButton
                  icon={Power}
                  label="Enable"
                  onClick={() => onRunQuickTool({ kind: "setEnabled", enabled: true }, bulkTarget)}
                />
                <ToolButton
                  icon={Power}
                  label="Disable"
                  destructiveSoft
                  onClick={() => onRunQuickTool({ kind: "setEnabled", enabled: false }, bulkTarget)}
                />
              </>
            )}
            {hasRepairableSelection && (
              <ToolButton icon={Wrench} label="Repair selected" onClick={onRepairSelected} />
            )}
            {pendingCount > 0 && (
              <ToolButton icon={ArrowRight} label="Review changes" onClick={onReviewChanges} />
            )}
          </div>
          {hasRepairableSelection && (
            <p className="mt-2 text-xs text-muted-foreground">
              {repairableSelectionCount} selected row(s) are missing setup. Repair uses
              preview/apply and protected zones will not be touched.
            </p>
          )}
          {protectedSelectionCount > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {protectedSelectionCount} selected row(s) are protected and will not receive bulk
              actions.
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
  disabled = false,
  destructiveSoft = false,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructiveSoft?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        destructiveSoft
          ? "border-destructive/20 text-destructive hover:bg-destructive/10"
          : "border-border text-foreground hover:border-primary/40 hover:bg-primary/10",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SetPriceTool({ onApply }: { onApply: (value: number) => void }) {
  const [price, setPrice] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/10"
      >
        <Coins className="h-3.5 w-3.5" />
        Set price
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-60 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
          <p className="mb-2 text-xs font-medium">Set fixed price</p>
          <div className="flex items-center gap-2">
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="e.g. 800"
              className="h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">DZD</span>
          </div>
          <Button
            size="sm"
            className="mt-2 h-7 w-full"
            onClick={() => {
              const numericPrice = Number(price.replace(/[^\d]/g, ""));
              if (numericPrice > 0) {
                onApply(numericPrice);
                setOpen(false);
              }
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

function PercentTool({ onApply }: { onApply: (value: number) => void }) {
  const [percent, setPercent] = useState("10");
  const [sign, setSign] = useState<"+" | "-">("+");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/10"
      >
        <Percent className="h-3.5 w-3.5" />
        Change by %
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-64 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
          <p className="mb-2 text-xs font-medium">Adjust by percentage</p>
          <div className="flex items-center gap-2">
            <Segmented
              value={sign}
              onChange={setSign}
              options={[
                { value: "+", label: "Increase" },
                { value: "-", label: "Decrease" },
              ]}
            />
            <Input
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <Button
            size="sm"
            className="mt-2 h-7 w-full"
            onClick={() => {
              const numericPercent = Number(percent.replace(/[^\d.]/g, ""));
              if (!Number.isNaN(numericPercent)) {
                onApply(sign === "+" ? numericPercent : -numericPercent);
                setOpen(false);
              }
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

function AmountTool({ onApply }: { onApply: (value: number) => void }) {
  const [amount, setAmount] = useState("50");
  const [sign, setSign] = useState<"+" | "-">("+");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/10"
      >
        <Plus className="h-3.5 w-3.5" />
        Add / subtract
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-64 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-md">
          <p className="mb-2 text-xs font-medium">Add or subtract fixed amount</p>
          <div className="flex items-center gap-2">
            <Segmented
              value={sign}
              onChange={setSign}
              options={[
                { value: "+", label: "Add" },
                { value: "-", label: "Subtract" },
              ]}
            />
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">DZD</span>
          </div>
          <Button
            size="sm"
            className="mt-2 h-7 w-full"
            onClick={() => {
              const numericAmount = Number(amount.replace(/[^\d.]/g, ""));
              if (!Number.isNaN(numericAmount)) {
                onApply(sign === "+" ? numericAmount : -numericAmount);
                setOpen(false);
              }
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

function RoundTool({ onApply }: { onApply: (nearest: 10 | 50 | 100) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary/10"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Round to
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-44 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="px-1 pb-1 text-xs font-medium">Round to nearest</p>
          {([10, 50, 100] as const).map((nearest) => (
            <button
              key={nearest}
              type="button"
              onClick={() => {
                onApply(nearest);
                setOpen(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
            >
              {nearest} DZD
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented<TValue extends string>({
  value,
  onChange,
  options,
}: {
  value: TValue;
  onChange: (value: TValue) => void;
  options: Array<{ value: TValue; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-6 rounded px-2.5 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
