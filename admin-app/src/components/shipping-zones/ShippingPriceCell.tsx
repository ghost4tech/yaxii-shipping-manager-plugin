import { useEffect, useState } from "react";
import { ArrowRight, Undo2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDzdPrice } from "@/lib/shipping-zones/status";
import type { ShippingZoneMethodView } from "@/types/shipping-zones";

export function ShippingPriceCell({
  method,
  onChange,
  onUndo,
}: {
  method: ShippingZoneMethodView;
  onChange: (price: number | null | undefined) => void;
  onUndo: () => void;
}) {
  const pending = method.pendingPrice !== undefined;
  const displayPrice = pending ? method.pendingPrice : method.livePrice;
  const freeSelected = displayPrice === 0;
  const [lastPaidPrice, setLastPaidPrice] = useState<number | null>(nextPaidPrice(method));

  useEffect(() => {
    if (typeof displayPrice === "number" && displayPrice > 0) {
      setLastPaidPrice(displayPrice);
    }
  }, [displayPrice]);

  if (!method.canEdit) {
    return (
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center rounded-md border border-dashed border-border bg-muted/40 px-2.5">
            {method.enabled === false ? "-" : formatDzdPrice(method.livePrice)}
          </span>
          <span className="text-[11px]">{method.disabledReason ?? "Not managed"}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Switch
            checked={method.enabled ?? false}
            disabled
            aria-label={`${method.label} enable status`}
          />
          <span>{method.enabled === false ? "Enable/disable coming later" : "Status locked"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {freeSelected ? (
          <span
            className={cn(
              "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold",
              pending
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-sky-200 bg-sky-50 text-sky-700",
            )}
          >
            Free
          </span>
        ) : (
          <div className="relative">
            <Input
              value={displayPrice ?? ""}
              onChange={(event) => onChange(priceFromInput(event.target.value))}
              className={cn(
                "h-8 w-24 rounded-md pr-9 text-sm tabular-nums shadow-none",
                pending && "border-primary/50 bg-card",
              )}
              aria-label={`${method.label} price`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
              DZD
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Switch
            checked={freeSelected}
            onCheckedChange={(checked) => onChange(checked ? 0 : lastPaidPrice)}
            aria-label={`${method.label} free shipping`}
          />
          <span>Free shipping</span>
        </div>
      </div>
      <PendingPriceLine method={method} pending={pending} onUndo={onUndo} />
    </div>
  );
}

function PendingPriceLine({
  method,
  pending,
  onUndo,
}: {
  method: ShippingZoneMethodView;
  pending: boolean;
  onUndo: () => void;
}) {
  if (!pending) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Live - {formatDzdPrice(method.livePrice)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
        <span className="text-muted-foreground line-through">
          {formatDzdPrice(method.livePrice)}
        </span>
        <ArrowRight className="h-2.5 w-2.5" />
        <span>{formatDzdPrice(method.pendingPrice ?? null)}</span>
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Undo ${method.label} change`}
      >
        <Undo2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function priceFromInput(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  const price = Number(trimmed);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function nextPaidPrice(method: ShippingZoneMethodView): number | null {
  if (method.livePrice !== null && method.livePrice !== 0) {
    return method.livePrice;
  }

  return method.defaultPrice ?? null;
}
