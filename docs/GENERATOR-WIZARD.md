# Generator Wizard Contract

## Purpose

The Generator is a setup and repair assistant for WooCommerce shipping zones. It prepares a draft, runs the real preview planner, and calls the safe apply endpoint only from the Generate step when the preview supports work.

Shipping Editor remains the daily management center for live price and method-status changes.

## Current MVP Flow

The wizard uses seven steps:

1. `Start`
2. `Coverage`
3. `Methods`
4. `Prices`
5. `Names`
6. `Preview`
7. `Generate`

Removed standalone steps:

- Commune coverage
- Safety check

Safety copy is shown inline in Preview and Generate.

## Start

Start is a dedicated first step.

The Start screen is state-aware and is derived from diagnostics when available:

- No configured Yaxii-managed setup or many missing wilayas: `Create a new shipping setup`
- Missing managed zones or method gaps: `Repair missing setup`
- Fully managed setup: `Your shipping setup is already active`
- Duplicate/manual conflicts: `Manual zones need review`

State actions:

- Fresh setup shows `Start setup` and defaults to all wilayas in the selected dataset.
- After Yaxii-managed setup removal, an empty managed registry plus mostly missing wilayas shows `Create a new Yaxii setup`, even if protected manual WooCommerce zones remain.
- Repair setup shows `Repair setup` and preselects only missing or method-incomplete managed wilayas.
- Fully active setup shows `Open Shipping Editor` as the primary action and `Modify setup anyway` as the secondary action.
- Manual conflicts show `Review Diagnostics` and `Open WooCommerce zones`.
- `Preview only` is a small advanced/support option with the copy `Review a plan without applying changes.`

Choice copy:

- `Create new setup`: `Create a new shipping setup for selected wilayas.`
- `Repair existing setup`: `Fix missing Yaxii-managed zones or methods. Manual zones are not touched.`
- `Preview only`: `Review a plan without applying changes.`

When setup is already active, Start shows:

```text
Your shipping setup is already active
Yaxii-managed zones and methods already exist. Use Shipping Editor to change prices or enable/disable methods.
```

`Preview only` is for support or agency review. It stops at Preview with a `Done reviewing` action and does not show Generate/apply controls.

CSV import is not part of the Generator flow.

When no Yaxii-managed setup is recorded but manual WooCommerce zones exist, Start keeps the setup path available:

```text
Create a new Yaxii setup
Manual WooCommerce zones exist and will be protected.
```

The primary action remains `Start setup`. `Review manual zones` opens Diagnostics. Manual conflicts can still be skipped or blocked by Preview/Apply for selected wilayas, but a protected manual zone does not make the whole generator start screen unusable.

When Shipping Editor is in the empty setup state, its `Generate shipping zones` action opens this same create setup path.

## Coverage

Coverage lets the merchant choose the dataset mode and selected wilayas.

Supported dataset modes:

- `Current Algeria dataset`
- `Legacy 58-compatible dataset`

Legacy mode is generated from the current normalized dataset by filtering wilaya codes `01` through `58`. Counts are derived from the loaded dataset response.

When `Repair existing setup` is selected, diagnostics preselects missing wilayas and managed zones with method gaps when that information is available. Manual/conflict rows are not selected for repair.

If repair has no missing or incomplete managed setup, the wizard shows `No repair needed` and points merchants back to Shipping Editor.

When `Create new setup` is used while Yaxii-managed setup already exists, the wizard warns:

```text
Existing Yaxii-managed setup found. This mode will only preview supported missing or changed work.
```

## Communes

Communes are not a main step.

Coverage includes a collapsed `Commune reference` section with this boundary:

```text
Yaxii uses wilaya-level WooCommerce zones in this release. Communes are shown for reference only.
```

Opening commune reference lazy-loads commune records for selected wilayas through the dataset REST endpoint using the active dataset mode. Commune-specific pricing is not implemented.

## Methods

Methods controls which flat-rate methods are included in the setup preview and what labels are sent to preview:

- Home delivery
- Office / stopdesk delivery
- Custom method 1
- Custom method 2

Home delivery and office delivery remain enabled by default. Custom method slots are optional.

## Prices

Prices controls draft prices separately from method selection:

- Default prices for enabled methods
- Custom method prices when custom methods are enabled
- Per-wilaya overrides for selected wilayas

Price validation allows empty values and `0` or `free` for free shipping. Invalid or negative prices block forward movement until corrected. Prices are local draft values until Preview and Generate.

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

If the preview has no creates, method additions, method updates, or method status changes, the preview says:

```text
Setup already matches this selection
```

This no-op state is not treated as blocked. Detailed plan groups are hidden by default for this no-op state; advanced details remain collapsed for support.

## Generate

Generate calls the real `POST /apply` endpoint through `fetchApply` when all backend gates allow it.

Generate is hidden or replaced with a no-op action when:

- Setup mode is `Preview only`
- The preview has no supported work
- Conflicts block apply
- Readiness is blocked

If no work is needed, the wizard says `Setup already matches this selection` and offers `Open Shipping Editor`.

The Generate step does not show a normal Generate button when the preview has no supported work. It shows:

```text
No setup changes needed
WooCommerce already matches this setup. Use Shipping Editor for daily price changes.
```

Actions:

- `Open Shipping Editor`

After a successful generate action, `Return to shipping editor` closes the wizard, opens Shipping Editor, and requests fresh diagnostics so the generated setup is visible without reloading the browser.
- `Back to edit setup`

If the preview contains only unsupported work such as existing zone-name updates, the Generate step says:

```text
No supported changes in this release
```

It explains that zone-name updates are previewed for support but are not written by this release.

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
