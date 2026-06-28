# Preview Planner

The preview planner generates a read-only dry-run plan for future WooCommerce shipping-zone changes.

It exists between diagnostics and the safe apply engine. It lets a merchant inspect proposed creates, updates, skips, conflicts, and warnings before any WooCommerce write is attempted.

## Endpoint

```text
POST /wp-json/yaxii-shipping-manager/v1/preview
```

The endpoint accepts a draft payload, but it does not write to WooCommerce or WordPress settings.

Access uses the same protected admin policy as settings and diagnostics:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`
- `X-WP-Nonce` is required

## Inputs

If no request body is provided, the planner uses persisted settings and all current wilayas.

Optional draft override fields:

- `selectedWilayaCodes`
- `pricingRows`
- `methods`
- `zoneNameFormat`
- `zonePrefix`
- `regionLabelFormat`

Unknown fields are rejected. Invalid wilaya codes, method keys, method types, and negative prices are rejected.

## Output Groups

The response includes:

- `createZones`
- `updateZones`
- `addMethods`
- `updateMethods`
- `skipManualZones`
- `conflicts`
- `warnings`
- `unchanged`

The response also includes a summary, `generatedAt`, locked `safetyPolicy`, and:

```json
{
  "previewHash": "64-character sha256 hash",
  "previewGeneratedAt": "2026-06-28T00:00:00+00:00",
  "applyContractVersion": "apply-contract-v1",
  "canApplyLater": false,
  "canApplyLaterMessage": "Apply can create missing Yaxii-managed zones, add missing methods, or update Yaxii-managed method prices and labels."
}
```

`previewHash` is deterministic for the selected wilayas, summary, plan groups, locked safety policy, and apply contract version. It is not persisted.

The response also includes `applyReadiness`, a UX state derived from diagnostics, the preview plan, the apply contract, and locked safety policy. It explains whether the store looks fresh, partial, manually configured, conflicted, missing methods, Yaxii-managed, or blocked.

In TASK-008C, `canApplyLater` is `true` only when:

- the preview has at least one `createZones`, `addMethods`, or registry-owned `updateMethods` item
- readiness is not blocked
- conflicts are empty

The apply endpoint still regenerates and compares the preview before creating any zone, adding any method, or updating any registry-owned method.

Preview items that involve WooCommerce zones include an ownership source:

- `managed_registry`: the zone ID exists in the Yaxii managed registry.
- `yaxii_name_hint`: the zone name only looks like a Yaxii zone.
- `manual_unknown`: the zone is treated as manual or unknown and protected.

For duplicate/conflict items, `ownershipSources` lists the ownership sources detected across the conflicting zones.

## Planning Rules

- A selected wilaya with no direct `DZ:NN` zone becomes a `createZones` preview item.
- A managed-registry direct zone may receive preview-only zone updates or supported registry-owned method updates.
- A Yaxii-looking direct zone may receive preview-only zone or method updates, but the hint is weak.
- A manual or unknown zone that overlaps a wilaya is placed in `skipManualZones`.
- Duplicate direct zones for the same wilaya are placed in `conflicts`.
- Missing enabled methods become `addMethods`.
- Method label or price differences become `updateMethods`. For registry-owned zones, the planner matches recorded method instances by registry `instanceId` before falling back to title/heuristic matching.
- Existing matching zones and methods become `unchanged`.

The planner is deterministic. The same dataset, settings, diagnostics, and draft payload return the same plan groups.

Ownership priority is:

1. Managed registry.
2. Yaxii name hint.
3. Manual or unknown.

## Safety Rules

The MVP safety policy remains locked on:

- Protect manual WooCommerce zones.
- Require preview before apply.
- Skip conflicts by default.
- Never delete manual zones.

The planner never proposes deletes in the MVP.

## What The Planner Does Not Do

The planner does not:

- Create WooCommerce shipping zones.
- Update WooCommerce shipping zones.
- Delete WooCommerce shipping zones.
- Add shipping methods by itself.
- Update method prices by itself.
- Persist a preview plan.
- Modify checkout fields.
- Update existing zones, delete zones, delete methods, or adopt manual zones.

TASK-008C safe apply can create missing Yaxii-managed zones, add missing methods with prices to Yaxii-managed zones, and update labels or prices for existing registry-owned flat-rate method instances. Existing zone updates, deletes, reset/wipe tools, unknown method updates, and manual-zone adoption remain outside the planner's write scope.
