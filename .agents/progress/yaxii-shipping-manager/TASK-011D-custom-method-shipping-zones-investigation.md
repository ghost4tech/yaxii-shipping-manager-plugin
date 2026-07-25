# TASK-011D - Custom Method Shipping Zones Table Investigation

Date: 2026-06-29

## Goal

Investigate why a custom shipping method generated from the Generator appears in the generate result but is not visible in the Shipping Zones table.

## Scope

Read-only investigation only.

In scope:

- Generator apply behavior for custom methods.
- WooCommerce zone/method readback.
- Yaxii managed registry readback.
- Shipping Zones table data mapping.

Out of scope:

- Product code changes.
- WooCommerce writes.
- Reset or cleanup tooling.
- Provider, sync, CSV, or commune pricing work.

## Git State

- Branch: `task/011c-generator-preview-reference-ui`
- Head before investigation: `513f140`
- Pre-existing dirty files were present before this investigation and were not touched.

## Evidence

Live WooCommerce and registry readback showed:

- Managed registry records: `69`
- `home_delivery` methods recorded: `69`
- `office_delivery` methods recorded: `69`
- `custom_1` methods recorded: `69`
- Sample custom method: zone `4`, wilaya `02`, instance `148`, title `Custom method 1`, cost `450`, enabled `true`
- WooCommerce zone sample for Chlef contained three flat-rate methods:
  - `Home delivery`, cost `700`
  - `Office delivery`, cost `400`
  - `Custom method 1`, cost `450`

Persisted plugin settings still showed:

- `custom_1.enabled = false`
- `custom_2.enabled = false`

## Root Cause

The custom method was created in WooCommerce and recorded in the Yaxii managed registry. The Shipping Zones table does not display it because the table is still modeled as a two-method view.

Code evidence:

- `admin-app/src/routes/index.tsx` derives Shipping Zones method definitions from persisted settings with `enabledMethodDefs(settingsState.response.settings.methods)`.
- `admin-app/src/data/default-settings.ts` keeps `custom_1` and `custom_2` disabled by default.
- `admin-app/src/lib/shipping-zones/status.ts` destructures only the first two method definitions:
  - `const [homeMethod, officeMethod] = methodDefs;`
- The same helper returns only two method keys:
  - `methodDefs.slice(0, 2)`
- `ShippingZoneRow.tsx` renders exactly two `ShippingPriceCell` components:
  - `row.home`
  - `row.office`
- `ShippingZoneRow.tsx` table header is hardcoded to:
  - `Home delivery`
  - `Office / Stopdesk`

## Why The Generate Result Looked Correct

The generate result is based on `ApplyResponse.createdMethods` / `updatedMethods`, so it can accurately report custom methods added by the real backend.

The Shipping Zones table is not yet dynamic; it only renders the two supported management columns.

## User-Visible Symptom

After generating `custom_1`, WooCommerce contains the method and the registry records it, but the Shipping Zones table still shows only Home and Office columns.

## Safety Notes

- No WooCommerce writes were performed in this investigation.
- No backend write behavior was changed.
- No REST route was changed.
- Manual-zone protection was not affected.

## WordPress.org Compliance Notes

- No remote assets, tracking, licensing, or external calls were added.
- No product UI code changed.

## Recommended Fix Direction

Make the Shipping Zones table method-aware instead of hardcoded to Home and Office:

1. Build row method views from all displayable managed methods, not only the first two.
2. Include method definitions from live managed registry/diagnostics when custom methods exist, even if persisted settings still mark them disabled.
3. Replace `row.home` / `row.office` with `row.methods[]`.
4. Render dynamic method columns or a compact expandable method list.
5. Update pending price/status maps to work with every supported `ShippingMethodKey`.
6. Keep Home and Office as the primary columns if needed, but show custom methods in the row without hiding them.
7. Decide whether Generator-created custom methods should also persist method settings after a successful generate. That may be useful, but it is not sufficient alone because the table still hardcodes two cells.

## Maintainability Notes

- `admin-app/src/lib/shipping-zones/status.ts` is the main mapping bottleneck.
- `ShippingZoneRow.tsx` is visually hardcoded to two method cells.
- `admin-app/src/routes/index.tsx` remains large and should not absorb this fix.

## Checks Run

- Preflight git status and branch check.
- Read-only WP-CLI readback of WooCommerce zones and managed registry.
- Source inspection of generator apply, registry, settings, Shipping Zones row mapping, and table rendering.
- `git diff --check`
- `git status --short --untracked-files=all`

## Results

- Investigation confirmed the custom method exists in WooCommerce and the registry.
- Investigation confirmed the Shipping Zones table is the display limitation.

## Blockers

- None for investigation.

## Next Recommended Task

TASK-011E: make the Shipping Zones table display all managed methods created by Generator, including `custom_1` and `custom_2`, while keeping Home/Office editing behavior stable.

## Commit Hash

Not committed. Investigation/report only.
