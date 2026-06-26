import type { ReactNode } from "react";

export function ScreenHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ysm-screen-header">
      <div>
        <p className="ysm-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions && <div className="ysm-actions">{actions}</div>}
    </div>
  );
}

export function ComingLaterNotice({ children }: { children: ReactNode }) {
  return <div className="ysm-coming-later">{children}</div>;
}

export function DataNotice() {
  return (
    <div className="ysm-data-notice">
      Real dataset and WooCommerce state are not connected yet. This screen uses isolated prototype
      data until the dataset and read-only diagnostics tasks land.
    </div>
  );
}
