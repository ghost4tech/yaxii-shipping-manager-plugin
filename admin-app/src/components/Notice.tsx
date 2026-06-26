import type { ReactNode } from "react";

type NoticeProps = {
  children: ReactNode;
  tone?: "info" | "warn";
};

export function Notice({ children, tone = "info" }: NoticeProps) {
  return <div className={`ysm-notice is-${tone}`}>{children}</div>;
}
