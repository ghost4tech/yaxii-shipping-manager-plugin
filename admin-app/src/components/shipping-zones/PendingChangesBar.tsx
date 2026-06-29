import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PendingChangesBar({
  count,
  onDiscard,
  onReview,
}: {
  count: number;
  onDiscard: () => void;
  onReview: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-border bg-card/95 px-3 py-2 shadow-[0_10px_40px_-12px_rgb(15_23_42/0.25)] backdrop-blur">
        <div className="flex items-center gap-2 pl-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-medium">
            {count} pending change{count === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          className="px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Discard
        </button>
        <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={onReview}>
          Review
        </Button>
        <Button size="sm" className="h-8 rounded-full" onClick={onReview}>
          Save changes
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
