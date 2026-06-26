import { useMemo, useState } from "react";

import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";
import { StatusPill } from "../components/StatusPill";
import type { WilayaDraft } from "../types";

type DiagnosticsScreenProps = {
  wilayas: WilayaDraft[];
  woocommerceActive: boolean;
};

export function DiagnosticsScreen({ wilayas, woocommerceActive }: DiagnosticsScreenProps) {
  const [selectedCode, setSelectedCode] = useState(wilayas[0]?.code ?? "");
  const selectedWilaya = wilayas.find((wilaya) => wilaya.code === selectedCode) ?? wilayas[0];
  const enabledWilayas = wilayas.filter((wilaya) => wilaya.enabled).length;
  const manualZones = wilayas.filter((wilaya) => wilaya.status === "manual").length;
  const conflicts = wilayas.filter((wilaya) => wilaya.status === "conflict").length;
  const offeredMethods = useMemo(
    () => (selectedWilaya ? Object.values(selectedWilaya.methods).filter((method) => method.enabled) : []),
    [selectedWilaya],
  );

  return (
    <section className="ysm-screen">
      <SectionHeader
        description="Mock checkout protection view. Real WooCommerce reads are intentionally deferred."
        title="Diagnostics"
      />

      <Notice tone={woocommerceActive ? "info" : "warn"}>
        {woocommerceActive
          ? "WooCommerce is active, but diagnostics endpoints are not implemented yet."
          : "WooCommerce is inactive. The plugin is showing frontend foundation state only."}
      </Notice>

      <div className="ysm-grid is-4">
        <DiagnosticCard label="WooCommerce" status={woocommerceActive ? "ok" : "warn"} value={woocommerceActive ? "Active" : "Inactive"} />
        <DiagnosticCard label="Mock enabled wilayas" status="ok" value={`${enabledWilayas}/${wilayas.length}`} />
        <DiagnosticCard label="Manual zones" status={manualZones > 0 ? "warn" : "ok"} value={String(manualZones)} />
        <DiagnosticCard label="Conflicts" status={conflicts > 0 ? "warn" : "ok"} value={String(conflicts)} />
      </div>

      <div className="ysm-panel">
        <div className="ysm-panel-heading">
          <div>
            <h3>Checkout simulator</h3>
            <p>Select a mock wilaya to preview which local draft methods would be offered.</p>
          </div>
          <select onChange={(event) => setSelectedCode(event.target.value)} value={selectedCode}>
            {wilayas.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {wilaya.nameFr}
              </option>
            ))}
          </select>
        </div>

        {selectedWilaya && selectedWilaya.enabled && offeredMethods.length > 0 ? (
          <div className="ysm-method-list">
            {offeredMethods.map((method) => (
              <div className="ysm-method-row" key={method.id}>
                <span>{method.label}</span>
                <strong>{method.price} DZD</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="ysm-empty-box">This mock wilaya would show no available shipping method.</div>
        )}
      </div>
    </section>
  );
}

function DiagnosticCard({
  label,
  status,
  value,
}: {
  label: string;
  status: "ok" | "warn";
  value: string;
}) {
  return (
    <div className="ysm-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <StatusPill tone={status === "ok" ? "good" : "warn"}>{status === "ok" ? "Mock pass" : "Needs review"}</StatusPill>
    </div>
  );
}
