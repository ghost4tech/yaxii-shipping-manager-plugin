import { useState } from "react";

import { ComingLaterNotice, ScreenHeader } from "./shared";

export default function ImportExport() {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Import/Export"
        title="CSV workflow placeholder"
        description="Local CSV import/export remains mocked until backend validation exists."
      />

      <ComingLaterNotice>
        The CSV backend is not implemented. This UI only captures the intended MVP workflow shape
        and does not parse, save, or upload files.
      </ComingLaterNotice>

      <section className="ysm-panel">
        <label className="ysm-upload">
          <input
            accept=".csv"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
            type="file"
          />
          <strong>{fileName ?? "Choose a CSV file"}</strong>
          <span>Expected columns: wilaya_code, enabled, home_price, office_price</span>
        </label>
      </section>
    </div>
  );
}
