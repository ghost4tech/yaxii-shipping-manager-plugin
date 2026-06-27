# Settings and Wizard Contract

## Current Position

TASK-003A defines the MVP settings and wizard contract in the admin app only.

The settings shown in the UI are local draft state. They are not persisted to WordPress options yet, and they do not write to WooCommerce.

## MVP Settings

- Dataset mode: `current` or `legacy_58`
- Region label format: `fr`, `ar`, `fr_ar`, `ar_fr`
- Zone name format: `prefix_code_name`, `code_name`, `name_only`, `prefix_name`
- Zone prefix: default `Yaxii`
- Office method wording: Office delivery, Stopdesk, Bureau, or a custom label
- Default home price
- Default office/stopdesk price
- Optional custom method 1 price
- Optional custom method 2 price

Currency is not user-editable in the MVP settings. Future persisted settings should read the WooCommerce currency when WooCommerce data is available. The draft UI uses `DZD` as the fallback display label.

## Dataset Modes

Current mode is visible and available as `Current Algeria dataset`.

Legacy mode is visible but unavailable as `Legacy 58-compatible dataset` with the reason:

```text
Legacy mapping is not available yet.
```

Do not guess a legacy 58 mapping.

## Label Formats

- `fr`: French
- `ar`: Arabic
- `fr_ar`: French - Arabic
- `ar_fr`: Arabic - French

The old separate `Show Arabic names` and `Show French names` toggles are not part of the MVP settings contract.

## Zone Naming Formats

- `prefix_code_name`: `{prefix} - {code} {name}`
- `code_name`: `{code} - {name}`
- `name_only`: `{name}`
- `prefix_name`: `{prefix} - {name}`

`Zone prefix` defaults to `Yaxii`.

## Shipping Method Keys

MVP method keys are fixed:

- `home_delivery`
- `office_delivery`
- `custom_1`
- `custom_2`

Home delivery and office/stopdesk delivery are required. Custom method 1 and custom method 2 are optional.

Unlimited custom methods are not in the MVP because the preview planner and safe apply engine need a small, auditable method contract before they write WooCommerce shipping methods.

Each method template has:

- key
- enabled
- label
- default price
- type: `flat_rate`
- locked/system flag

## Locked Safety Policy

These safety rules are locked on in the MVP:

- Protect manual WooCommerce zones
- Require preview before apply
- Skip conflicts by default
- Never delete manual zones

The UI copy says these are required safety rules for the future apply engine. Users cannot disable them in TASK-003A.

## Wizard Contract

Wizard steps:

1. Setup path
2. Dataset mode
3. Label/naming
4. Shipping methods
5. Default prices
6. Wilaya selection
7. Review draft

All wizard actions remain local draft only.

The review screen must say:

```text
This is a local draft. WooCommerce preview/apply will be added after diagnostics and preview planner.
```

## Not Implemented Yet

TASK-003A does not implement:

- WordPress option persistence
- WooCommerce zone reads or writes
- WooCommerce diagnostics backend
- Preview planner
- Safe apply engine
- CSV backend
- YSF sync
- Provider imports
- Commune-level pricing
- Unlimited custom shipping methods
- Country expansion UI
