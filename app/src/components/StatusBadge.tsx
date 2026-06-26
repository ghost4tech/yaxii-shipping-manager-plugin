import { cn } from "@/lib/utils";

type Variant = "good" | "warning" | "critical" | "neutral" | "info" | "primary";

const styles: Record<Variant, string> = {
  good: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-sky/30 text-foreground border-sky/40",
  primary: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
