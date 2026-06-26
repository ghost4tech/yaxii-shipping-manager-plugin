import { useState } from "react";

import { ComingLaterNotice, ScreenHeader } from "./shared";

export default function Settings() {
  const [protectManualZones, setProtectManualZones] = useState(true);
  const [showArabicNames, setShowArabicNames] = useState(true);

  return (
    <div className="ysm-screen">
      <ScreenHeader
        eyebrow="Settings"
        title="Local settings placeholder"
        description="Settings are not persisted until the settings task lands."
      />

      <ComingLaterNotice>
        These controls are UI-only. No option is saved to WordPress in TASK-001B.
      </ComingLaterNotice>

      <section className="ysm-panel">
        <ToggleRow
          checked={protectManualZones}
          label="Protect manual WooCommerce zones"
          onChange={setProtectManualZones}
        />
        <ToggleRow
          checked={showArabicNames}
          label="Show Arabic wilaya names next to French names"
          onChange={setShowArabicNames}
        />
      </section>
    </div>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="ysm-toggle-row">
      <span>{label}</span>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
