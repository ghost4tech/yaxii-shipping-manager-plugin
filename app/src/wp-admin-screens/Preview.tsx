import { PREVIEW_CHANGES } from "../lib/mock-data";
import { ComingLaterNotice, DataNotice, ScreenHeader } from "./shared";

export default function Preview() {
  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Preview"
        title="Dry-run plan placeholder"
        description="The real preview planner is intentionally not implemented in this task."
      />

      <ComingLaterNotice>
        This screen must stay read-only until real diagnostics and preview planning exist. No apply
        button is shown in this stabilization build.
      </ComingLaterNotice>
      <DataNotice />

      <div className="ysm-grid ysm-grid-4">
        <PreviewCard label="Mock create" value={PREVIEW_CHANGES.toCreate.length} />
        <PreviewCard label="Mock update" value={PREVIEW_CHANGES.toUpdate.length} />
        <PreviewCard label="Mock conflicts" value={PREVIEW_CHANGES.conflicts.length} />
        <PreviewCard label="Mock skipped" value={PREVIEW_CHANGES.skipped.length} />
      </div>
    </div>
  );
}

function PreviewCard({ label, value }: { label: string; value: number }) {
  return (
    <section className="ysm-metric is-neutral">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
