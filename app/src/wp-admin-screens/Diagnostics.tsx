import { DIAGNOSTICS } from "../lib/mock-data";
import { ComingLaterNotice, DataNotice, ScreenHeader } from "./shared";

export default function Diagnostics() {
  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Diagnostics"
        title="Read-only diagnostics placeholder"
        description="This route is kept for the MVP but still uses mock checks."
      />

      <ComingLaterNotice>
        Real WooCommerce reads are deferred to the read-only diagnostics task. This screen does not
        inspect or modify store configuration.
      </ComingLaterNotice>
      <DataNotice />

      <section className="ysm-panel">
        <h3>Mock system checks</h3>
        <ul className="ysm-check-list">
          {DIAGNOSTICS.map((diagnostic) => (
            <li key={diagnostic.label}>
              <span className={`ysm-dot is-${diagnostic.severity}`} />
              <strong>{diagnostic.label}</strong>
              <p>{diagnostic.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
