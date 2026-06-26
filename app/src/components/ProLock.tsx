import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Wrap any section to lock it behind Pro. */
export function ProLock({
  feature,
  description,
  children,
  compact = false,
}: {
  feature: string;
  description?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const { isPro, setPlan } = usePlan();

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40 blur-[1.5px]" aria-hidden>
        {children}
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-xl",
          "bg-gradient-to-br from-background/60 via-background/85 to-background/95 backdrop-blur-[2px]",
        )}
      >
        <div
          className={cn(
            "flex max-w-sm flex-col items-center text-center",
            compact ? "gap-1.5 p-3" : "gap-2 p-5",
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
            <Lock className="h-4 w-4" />
          </div>
          <div className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{feature}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          <Button
            size="sm"
            onClick={() => { setPlan("pro"); toast.success("Pro unlocked (demo)"); }}
            className="mt-1 bg-amber-500 text-white hover:bg-amber-600"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Unlock Pro
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Tiny inline lock icon used in lists / table cells. */
export function ProInline({ label }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-amber-300/60 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
      title={label ?? "Pro feature"}
    >
      <Lock className="h-2.5 w-2.5" />
      Pro
    </span>
  );
}
