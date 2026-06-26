import type { ChangeEvent } from "react";

import { Notice } from "../components/Notice";
import { SectionHeader } from "../components/SectionHeader";
import { StatusPill } from "../components/StatusPill";
import type { MethodId, WilayaDraft, ZoneStatus } from "../types";

type ShippingZonesScreenProps = {
  wilayas: WilayaDraft[];
  onWilayasChange: (wilayas: WilayaDraft[]) => void;
};

const statusLabels: Record<ZoneStatus, string> = {
  conflict: "Conflict",
  draft: "Local draft",
  managed: "Mock managed",
  manual: "Manual zone",
  missing: "Missing",
};

export function ShippingZonesScreen({ wilayas, onWilayasChange }: ShippingZonesScreenProps) {
  const updateWilaya = (code: string, nextWilaya: (wilaya: WilayaDraft) => WilayaDraft) => {
    onWilayasChange(wilayas.map((wilaya) => (wilaya.code === code ? nextWilaya(wilaya) : wilaya)));
  };

  return (
    <section className="ysm-screen">
      <SectionHeader
        description="Edit a local pricing draft for wilayas, home delivery, and office/stopdesk delivery."
        title="Shipping Zones"
      />

      <Notice>
        Edits are local UI state only. Saving settings, previewing changes, and applying zones remain
        backend tasks.
      </Notice>

      <div className="ysm-table-wrap">
        <table className="ysm-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Wilaya</th>
              <th>Enabled</th>
              <th>Home delivery</th>
              <th>Office / Stopdesk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {wilayas.map((wilaya) => (
              <tr key={wilaya.code}>
                <td className="ysm-code">{wilaya.code}</td>
                <td>
                  <strong>{wilaya.nameFr}</strong>
                  <span dir="rtl" lang="ar">
                    {wilaya.nameAr}
                  </span>
                </td>
                <td>
                  <input
                    aria-label={`Enable ${wilaya.nameFr}`}
                    checked={wilaya.enabled}
                    onChange={(event) =>
                      updateWilaya(wilaya.code, (draft) => ({ ...draft, enabled: event.target.checked }))
                    }
                    type="checkbox"
                  />
                </td>
                <td>
                  <MethodEditor methodId="home" onChange={updateWilaya} wilaya={wilaya} />
                </td>
                <td>
                  <MethodEditor methodId="office" onChange={updateWilaya} wilaya={wilaya} />
                </td>
                <td>
                  <StatusPill tone={statusTone(wilaya.status)}>{statusLabels[wilaya.status]}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MethodEditor({
  methodId,
  onChange,
  wilaya,
}: {
  methodId: MethodId;
  onChange: (code: string, nextWilaya: (wilaya: WilayaDraft) => WilayaDraft) => void;
  wilaya: WilayaDraft;
}) {
  const method = wilaya.methods[methodId];

  const updatePrice = (event: ChangeEvent<HTMLInputElement>) => {
    const price = Number(event.target.value);
    onChange(wilaya.code, (draft) => ({
      ...draft,
      methods: {
        ...draft.methods,
        [methodId]: {
          ...draft.methods[methodId],
          price: Number.isFinite(price) ? price : 0,
        },
      },
    }));
  };

  const updateEnabled = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(wilaya.code, (draft) => ({
      ...draft,
      methods: {
        ...draft.methods,
        [methodId]: {
          ...draft.methods[methodId],
          enabled: event.target.checked,
        },
      },
    }));
  };

  return (
    <div className="ysm-method-editor">
      <label>
        <input checked={method.enabled} onChange={updateEnabled} type="checkbox" />
        <span>{method.label}</span>
      </label>
      <input
        aria-label={`${method.label} price for ${wilaya.nameFr}`}
        min="0"
        onChange={updatePrice}
        type="number"
        value={method.price}
      />
    </div>
  );
}

function statusTone(status: ZoneStatus): "good" | "warn" | "danger" | "neutral" {
  if (status === "managed") return "good";
  if (status === "conflict") return "danger";
  if (status === "manual" || status === "missing") return "warn";
  return "neutral";
}
