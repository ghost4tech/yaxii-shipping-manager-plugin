# Generator Wizard Contract

## Purpose

The Generator is a setup and repair assistant for WooCommerce shipping zones. It prepares a draft, runs the real preview planner, and calls the safe apply endpoint only from the Generate step when the preview supports work.

Shipping Zones remains the daily management center for live price and method-status changes.

## Current MVP Flow

The wizard uses five steps:

1. `Coverage`
2. `Methods and prices`
3. `Names`
4. `Preview`
5. `Generate`

Removed standalone steps:

- Commune coverage
- Safety check

Safety copy is shown inline in Preview and Generate.

## Guided Start

Coverage includes the start guidance.

Recommended path is derived from diagnostics when available:

- No configured Yaxii-managed setup or many missing wilayas: `Create new setup`
- Missing managed zones or method gaps: `Repair existing setup`
- Fully managed setup: `Setup already active`
- Duplicate/manual conflicts: `Manual zones need review`

Available user choices:

- `Create new setup`
- `Repair existing setup`
- `Preview only`

`Preview only` is for support or agency review and does not show a generate/apply action.

CSV import is not a primary path. The wizard only shows small disabled copy: `CSV import coming later.`

## Coverage

Coverage lets the merchant choose the dataset mode and selected wilayas.

Supported dataset modes:

- `Current Algeria dataset`
- `Legacy 58-compatible dataset`

Legacy mode is generated from the current normalized dataset by filtering wilaya codes `01` through `58`. Counts are derived from the loaded dataset response.

When `Repair existing setup` is selected, diagnostics preselects missing wilayas and managed zones with method gaps when that information is available. Manual/conflict rows are not selected for repair.

If repair has no missing or incomplete managed setup, the wizard shows `No repair needed` and points merchants back to Shipping Zones.

## Communes

Communes are not a main step.

Coverage includes a collapsed `Commune reference` section with this boundary:

```text
Yaxii uses wilaya-level WooCommerce zones in this release. Communes are shown for reference only.
```

Opening commune reference lazy-loads commune records for selected wilayas through the dataset REST endpoint using the active dataset mode. Commune-specific pricing is not implemented.

## Methods And Prices

This step combines method selection and pricing:

- Home delivery
- Office / stopdesk delivery
- Custom method 1
- Custom method 2

Home delivery and office delivery remain required. Custom method slots are optional. Prices are local draft values until Preview and Generate.

## Names

This step controls draft naming:

- Zone prefix
- Zone name format
- Region label format
- Office wording and custom office label

The UI states:

```text
Existing WooCommerce zone names are not changed in this release.
```

Zone-name updates may appear in preview details, but SafeApplyEngine does not update existing zone names.

## Preview

Preview auto-runs the real `POST /preview` request when the draft is valid and the merchant reaches the Preview step.

The preview request includes:

- `datasetMode`
- `selectedWilayaCodes`
- `pricingRows`
- `methods`
- `zoneNameFormat`
- `zonePrefix`
- `regionLabelFormat`

Preview shows safety copy inline:

- Manual zones are protected.
- No deletes will be made.
- WooCommerce is checked again before applying.

## Generate

Generate calls the real `POST /apply` endpoint through `fetchApply` when all backend gates allow it.

Generate is hidden or replaced with a no-op action when:

- Setup mode is `Preview only`
- The preview has no supported work
- Conflicts block apply
- Readiness is blocked

If no work is needed, the wizard says `Setup already matches this selection` and offers `Open Shipping Zones`.

## Backend Boundary

The wizard does not write directly to WooCommerce. All writes still go through:

- Preview
- Apply
- REST nonce and capability checks
- Preview hash and accepted summary validation
- Locked safety policy
- Managed registry ownership checks
- Fresh WooCommerce re-read

Still not implemented:

- CSV backend
- Commune-level pricing
- Provider imports
- YSF sync
- Manual-zone adoption
- Zone-name apply
- Reset/delete/wipe tooling
