import { useMemo, useState } from "react";

import { WILAYAS, type Wilaya } from "../lib/mock-data";
import { DataNotice, ScreenHeader } from "./shared";

export default function ShippingManager() {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      WILAYAS.filter((wilaya) =>
        `${wilaya.code} ${wilaya.nameFr} ${wilaya.nameAr}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ).slice(0, 24),
    [query],
  );

  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Shipping Manager"
        title="Wilaya pricing table"
        description="Free MVP table shape without saving or writing WooCommerce zones."
        actions={
          <a className="ysm-button" href="#/preview">
            Preview changes
          </a>
        }
      />

      <DataNotice />

      <section className="ysm-panel">
        <div className="ysm-toolbar">
          <input
            aria-label="Search wilayas"
            className="ysm-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search wilaya or code"
            type="search"
            value={query}
          />
          <span>{rows.length} shown</span>
        </div>

        <div className="ysm-table-wrap">
          <table className="ysm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Wilaya</th>
                <th>Home</th>
                <th>Office</th>
                <th>Woo status</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((wilaya) => (
                <WilayaRow key={wilaya.code} wilaya={wilaya} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WilayaRow({ wilaya }: { wilaya: Wilaya }) {
  return (
    <tr>
      <td className="ysm-code">{wilaya.code}</td>
      <td>
        <strong>{wilaya.nameFr}</strong>
        <span dir="rtl">{wilaya.nameAr}</span>
      </td>
      <td>{wilaya.homeEnabled ? `${wilaya.homePrice} DZD` : "Disabled"}</td>
      <td>{wilaya.officeEnabled ? `${wilaya.officePrice} DZD` : "Disabled"}</td>
      <td>
        <span className={`ysm-status-label is-${wilaya.wooStatus}`}>{wilaya.wooStatus}</span>
      </td>
      <td>{wilaya.enabled ? "Yes" : "No"}</td>
    </tr>
  );
}
