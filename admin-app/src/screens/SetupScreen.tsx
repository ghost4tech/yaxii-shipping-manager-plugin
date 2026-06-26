import { ClipboardList, FileUp, ListChecks } from "lucide-react";

import { Button } from "../components/Button";
import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";
import { datasetModes, setupPaths } from "../data/mock-data";
import type { DatasetMode, ScreenId, SetupPath, WilayaDraft } from "../types";

type SetupScreenProps = {
  datasetMode: DatasetMode;
  selectedPath: SetupPath;
  wilayas: WilayaDraft[];
  onDatasetModeChange: (mode: DatasetMode) => void;
  onNavigate: (screen: ScreenId) => void;
  onSetupPathChange: (path: SetupPath) => void;
};

const pathIcons: Record<SetupPath, typeof ListChecks> = {
  quick: ListChecks,
  manual: ClipboardList,
  csv: FileUp,
};

export function SetupScreen({
  datasetMode,
  selectedPath,
  wilayas,
  onDatasetModeChange,
  onNavigate,
  onSetupPathChange,
}: SetupScreenProps) {
  const enabledCount = wilayas.filter((wilaya) => wilaya.enabled).length;

  return (
    <section className="ysm-screen">
      <SectionHeader
        action={
          <Button onClick={() => onNavigate("zones")} type="button">
            Review local draft
          </Button>
        }
        description="Choose how a merchant or agency would prepare shipping intent. No WooCommerce writes happen in this task."
        title="Setup"
      />

      <Notice>
        This is a local mock flow. The real preview planner and safe apply engine are intentionally
        unavailable until later tasks.
      </Notice>

      <div className="ysm-grid is-3">
        {setupPaths.map((path) => {
          const Icon = pathIcons[path.id];
          const isSelected = selectedPath === path.id;

          return (
            <button
              className={isSelected ? "ysm-choice is-selected" : "ysm-choice"}
              key={path.id}
              onClick={() => onSetupPathChange(path.id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <strong>{path.title}</strong>
              <span>{path.description}</span>
            </button>
          );
        })}
      </div>

      <div className="ysm-panel">
        <div className="ysm-panel-heading">
          <div>
            <h3>Dataset mode</h3>
            <p>Labels are PRD-safe placeholders until TASK-002 replaces mock rows.</p>
          </div>
        </div>
        <div className="ysm-option-stack">
          {datasetModes.map((mode) => (
            <label className="ysm-radio-row" key={mode.id}>
              <input
                checked={datasetMode === mode.id}
                name="dataset-mode"
                onChange={() => onDatasetModeChange(mode.id)}
                type="radio"
              />
              <span>
                <strong>{mode.title}</strong>
                <small>{mode.description}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="ysm-grid is-3">
        <DraftMetric label="Mock wilayas enabled" value={`${enabledCount}/${wilayas.length}`} />
        <DraftMetric label="Selected path" value={setupPaths.find((path) => path.id === selectedPath)?.title ?? ""} />
        <DraftMetric
          label="Dataset label"
          value={datasetModes.find((mode) => mode.id === datasetMode)?.title ?? ""}
        />
      </div>
    </section>
  );
}

function DraftMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ysm-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
