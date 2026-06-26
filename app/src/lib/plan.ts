import { useEffect, useState } from "react";

export type Plan = "free" | "pro";

const KEY = "yaxii.plan";
const COUNTRY_KEY = "yaxii.country";

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }

export function getPlan(): Plan {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(KEY) as Plan) || "free";
}
export function setPlan(p: Plan) {
  localStorage.setItem(KEY, p);
  emit();
}
export function getCountry(): string {
  if (typeof window === "undefined") return "DZ";
  return localStorage.getItem(COUNTRY_KEY) || "DZ";
}
export function setCountry(c: string) {
  localStorage.setItem(COUNTRY_KEY, c);
  emit();
}

export function usePlan() {
  const [plan, setLocal] = useState<Plan>(() => getPlan());
  const [country, setLocalCountry] = useState<string>(() => getCountry());
  useEffect(() => {
    const l = () => { setLocal(getPlan()); setLocalCountry(getCountry()); };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    plan,
    country,
    isPro: plan === "pro",
    setPlan,
    setCountry,
  };
}

/** Features locked behind Pro. Keep in sync with marketing copy. */
export const PRO_FEATURES = {
  bulkEdit: "Bulk price editing",
  automations: "Automations",
  cleanupMode: "Cleanup mode",
  scheduledSync: "Scheduled YSF sync",
  csvExport: "CSV export",
  advancedDiagnostics: "Advanced diagnostics",
  perMethodPricing: "Per-method pricing rules",
  multiCountry: "Multi-country shipping",
} as const;
