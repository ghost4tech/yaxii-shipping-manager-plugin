import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className, size = "sm" }: { className?: string; size?: "sm" | "xs" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-amber-300/60 bg-amber-50 font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
        size === "xs" ? "px-1 py-0 text-[9px]" : "px-1.5 py-0.5 text-[10px]",
        className,
      )}
    >
      <Sparkles className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      PRO
    </span>
  );
}
