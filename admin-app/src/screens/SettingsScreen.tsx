import { useState } from "react";

import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";
import { datasetModes } from "../data/mock-data";
import type { DatasetMode } from "../types";

type SettingsScreenProps = {
  datasetMode: DatasetMode;
  onDatasetModeChange: (mode: DatasetMode) => void;
};

export function SettingsScreen({ datasetMode, onDatasetModeChange }: SettingsScreenProps) {
  const [protectManualZones, setProtectManualZones] = useState(true);
  const [requirePreview, setRequirePreview] = useState(true);
  const [showArabicNames, setShowArabicNames] = useState(true);

  return (
    <section className="ysm-screen">
      <SectionHeader
        description="Mock local controls for safety defaults and display preferences."
        title="Settings"
      />

      <Notice>Settings are not persisted until the settings repository task lands.</Notice>

      <div className="ysm-panel">
        <SettingRow label="Dataset mode" note="Used by setup and local table defaults.">
          <select
            onChange={(event) => onDatasetModeChange(event.target.value as DatasetMode)}
            value={datasetMode}
          >
            {datasetModes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.title}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="Protect manual WooCommerce zones" note="Manual zones must be skipped by default.">
          <input
            checked={protectManualZones}
            onChange={(event) => setProtectManualZones(event.target.checked)}
            type="checkbox"
          />
        </SettingRow>
        <SettingRow label="Require preview before writes" note="Apply engine remains unavailable in this task.">
          <input checked={requirePreview} onChange={(event) => setRequirePreview(event.target.checked)} type="checkbox" />
        </SettingRow>
        <SettingRow label="Show Arabic names" note="Display preference only; no translation extraction yet.">
          <input checked={showArabicNames} onChange={(event) => setShowArabicNames(event.target.checked)} type="checkbox" />
        </SettingRow>
      </div>
    </section>
  );
}

function SettingRow({
  children,
  label,
  note,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
}) {
  return (
    <div className="ysm-setting-row">
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      {children}
    </div>
  );
}
