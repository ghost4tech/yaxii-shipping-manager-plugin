import type { ReactNode } from "react";

type StatusPillProps = {
  children: ReactNode;
  tone?: "good" | "warn" | "danger" | "neutral";
};

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={`ysm-status-pill is-${tone}`}>{children}</span>;
}
