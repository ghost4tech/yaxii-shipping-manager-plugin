import { Check, ChevronsUpDown, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlan, setCountry } from "@/lib/plan";
import { COUNTRIES } from "@/lib/mock-data";
import { toast } from "sonner";

export function CountrySwitcher() {
  const { country, isPro } = usePlan();
  const active = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex w-full items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-left text-xs transition hover:border-primary/40 group-data-[collapsible=icon]:hidden">
          <span className="text-base leading-none">{active.flag}</span>
          <div className="flex flex-1 flex-col leading-tight">
            <span className="font-medium">{active.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {active.wilayaCount} {active.regionLabel}
            </span>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Shipping dataset
        </DropdownMenuLabel>
        {COUNTRIES.filter((c) => c.available).map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCountry(c.code)}
            className="gap-2"
          >
            <span className="text-base">{c.flag}</span>
            <div className="flex-1">
              <div className="text-sm">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {c.wilayaCount} {c.regionLabel}
              </div>
            </div>
            {c.code === active.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Coming soon
        </DropdownMenuLabel>
        {COUNTRIES.filter((c) => !c.available).map((c) => (
          <DropdownMenuItem
            key={c.code}
            disabled={!isPro}
            onClick={() => {
              if (!isPro) {
                toast.info(`${c.name} dataset requires Pro`);
                return;
              }
              toast.success(`${c.name} preview enabled`);
            }}
            className="gap-2 opacity-70"
          >
            <span className="text-base">{c.flag}</span>
            <div className="flex-1">
              <div className="text-sm">{c.name}</div>
              <div className="text-[10px] text-muted-foreground">{c.wilayaCount} {c.regionLabel}</div>
            </div>
            <Lock className="h-3 w-3 text-amber-600" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
