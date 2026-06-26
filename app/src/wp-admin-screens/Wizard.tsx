import { useMemo, useState } from "react";

import { WILAYAS } from "../lib/mock-data";
import { DataNotice, ScreenHeader } from "./shared";

type SetupPath = "quick" | "manual" | "csv";

export default function Wizard() {
  const [setupPath, setSetupPath] = useState<SetupPath>("quick");
  const [selectedCodes, setSelectedCodes] = useState(
    () => new Set(WILAYAS.map((wilaya) => wilaya.code)),
  );
  const selectedCount = selectedCodes.size;
  const visibleWilayas = useMemo(() => WILAYAS.slice(0, 18), []);

  const toggleWilaya = (code: string) => {
    setSelectedCodes((currentCodes) => {
      const nextCodes = new Set(currentCodes);

      if (nextCodes.has(code)) {
        nextCodes.delete(code);
      } else {
        nextCodes.add(code);
      }

      return nextCodes;
    });
  };

  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Wizard"
        title="Choose setup intent"
        description="Capture the merchant's intended workflow without writing to WooCommerce."
        actions={
          <a className="ysm-button" href="#/preview">
            Go to preview
          </a>
        }
      />

      <DataNotice />

      <div className="ysm-grid ysm-grid-3">
        {[
          ["quick", "Quick setup", "Enable all wilayas with default home and office prices."],
          ["manual", "Manual setup", "Choose wilayas before editing prices in the manager."],
          ["csv", "CSV import", "Validate a local CSV later; backend is not implemented yet."],
        ].map(([path, title, description]) => (
          <button
            className={setupPath === path ? "ysm-choice is-selected" : "ysm-choice"}
            key={path}
            onClick={() => setSetupPath(path as SetupPath)}
            type="button"
          >
            <strong>{title}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>

      <section className="ysm-panel">
        <div className="ysm-panel-heading">
          <div>
            <h3>Wilaya selection preview</h3>
            <p>{selectedCount} mock wilayas selected.</p>
          </div>
          <button
            className="ysm-button is-secondary"
            onClick={() => setSelectedCodes(new Set(WILAYAS.map((wilaya) => wilaya.code)))}
            type="button"
          >
            Select all
          </button>
        </div>

        <div className="ysm-wilaya-grid">
          {visibleWilayas.map((wilaya) => (
            <button
              className={
                selectedCodes.has(wilaya.code) ? "ysm-wilaya-chip is-selected" : "ysm-wilaya-chip"
              }
              key={wilaya.code}
              onClick={() => toggleWilaya(wilaya.code)}
              type="button"
            >
              <span>{wilaya.code}</span>
              {wilaya.nameFr}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
