import { useState, type ChangeEvent } from "react";

import { Button } from "../components/Button";
import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";

export function ImportExportScreen() {
  const [fileName, setFileName] = useState("");

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.files?.[0]?.name ?? "");
  };

  return (
    <section className="ysm-screen">
      <SectionHeader
        description="Prepare agency import/export workflows without parsing or writing files yet."
        title="Import / Export"
      />

      <Notice>CSV parsing, validation, persistence, and exports remain backend tasks.</Notice>

      <div className="ysm-grid is-2">
        <div className="ysm-panel">
          <h3>Import CSV</h3>
          <p>Use the target MVP shape once backend validation is available.</p>
          <label className="ysm-upload">
            <span>{fileName || "Choose a local CSV file"}</span>
            <input accept=".csv,text/csv" onChange={selectFile} type="file" />
          </label>
          <Button disabled type="button" variant="secondary">
            Validate after CSV backend lands
          </Button>
        </div>

        <div className="ysm-panel">
          <h3>Export</h3>
          <p>Exports are shown as the intended free MVP workflow, not as live downloads.</p>
          <div className="ysm-method-list">
            <ExportRow description="Wilaya, enabled state, home price, and office price." title="Yaxii configuration CSV" />
            <ExportRow description="Future read-only WooCommerce zone and method snapshot." title="WooCommerce zones snapshot" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExportRow({ description, title }: { description: string; title: string }) {
  return (
    <div className="ysm-method-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Button disabled type="button" variant="quiet">
        Export later
      </Button>
    </div>
  );
}
