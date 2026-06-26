import { ComingLaterNotice, ScreenHeader } from "./shared";

export default function YsfSync() {
  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="YSF Sync"
        title="Coming later"
        description="YSF bridge concepts stay disabled and informational in the free MVP."
      />

      <ComingLaterNotice>
        Full YSF sync is outside the MVP. No YSF detection, import, sync, remote call, or provider
        dispatch behavior exists in this build.
      </ComingLaterNotice>

      <section className="ysm-panel">
        <h3>Allowed current state</h3>
        <p>
          Manual WooCommerce shipping setup remains the active direction. A future bridge can be
          scoped after the core dataset, diagnostics, preview, and safe apply flow are proven.
        </p>
      </section>
    </div>
  );
}
