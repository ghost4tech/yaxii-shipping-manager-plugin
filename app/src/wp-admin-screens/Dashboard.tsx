import { AlertTriangle, CheckCircle2, Database, MapPinned } from "lucide-react";

import { SETUP_STATUS } from "../lib/mock-data";
import { DataNotice, ScreenHeader } from "./shared";

export default function Dashboard() {
  const configuredPercent = Math.round(
    (SETUP_STATUS.enabledWilayas / SETUP_STATUS.totalWilayas) * 100,
  );

  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Foundation"
        title="Setup overview"
        description="A lightweight MVP dashboard for the WordPress admin mount."
        actions={
          <a className="ysm-button" href="#/wizard">
            Start wizard
          </a>
        }
      />

      <DataNotice />

      <div className="ysm-grid ysm-grid-4">
        <MetricCard
          icon={CheckCircle2}
          label="Prototype configured"
          tone="good"
          value={`${configuredPercent}%`}
        />
        <MetricCard
          icon={MapPinned}
          label="Mock wilayas enabled"
          tone="neutral"
          value={`${SETUP_STATUS.enabledWilayas}/${SETUP_STATUS.totalWilayas}`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Mock missing zones"
          tone="warn"
          value={String(SETUP_STATUS.missingZones)}
        />
        <MetricCard icon={Database} label="Dataset backend" tone="neutral" value="Pending" />
      </div>

      <section className="ysm-panel">
        <h3>Next safe sequence</h3>
        <ol className="ysm-steps">
          <li>Harden the Algeria dataset and remove legacy wording risks.</li>
          <li>Add settings persistence for local shipping intent.</li>
          <li>Read WooCommerce shipping zones before planning any write.</li>
          <li>Generate a dry-run preview before enabling an apply engine.</li>
        </ol>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: "good" | "warn" | "neutral";
  value: string;
}) {
  return (
    <section className={`ysm-metric is-${tone}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
