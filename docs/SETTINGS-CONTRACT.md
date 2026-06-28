# Settings and Wizard Contract

## Current Position

TASK-003B persists the MVP settings contract in WordPress options and exposes read/write REST endpoints for the admin app.

The settings remain product-configuration draft data. They do not create, update, delete, or inspect WooCommerce shipping zones.

## Option Storage

Settings are stored in one WordPress option:

```text
yaxii_shipping_manager_settings
```

Storage rules:

- The option value is an array.
- The option is created with autoload disabled.
- Dataset rows are not stored in the option.
- Raw source data is not stored in the option.
- WooCommerce zone IDs are stored only in the managed zone registry, not in settings.
- Secrets are not stored.

## REST Endpoints

Settings endpoints use the existing plugin namespace:

```text
GET /wp-json/yaxii-shipping-manager/v1/settings
PUT /wp-json/yaxii-shipping-manager/v1/settings
```

Access policy matches bootstrap and dataset access:

- WooCommerce active: requires `manage_woocommerce`.
- WooCommerce inactive: requires `manage_options`.
- `PUT` also requires the WordPress REST nonce in `X-WP-Nonce`.

The response includes:

- `settings`: sanitized active settings.
- `defaults`: plugin defaults.
- `options`: settings metadata.
- `warnings`: repair or forced-safety warnings.

Unknown keys are rejected on save. Invalid enum values, duplicate method keys, negative prices, unsupported method types, and unavailable legacy mode are returned as REST errors.

## Persisted MVP Settings

- `datasetMode`: `current`
- `regionLabelFormat`: `fr`, `ar`, `fr_ar`, or `ar_fr`
- `zoneNameFormat`: `prefix_code_name`, `code_name`, `name_only`, or `prefix_name`
- `zonePrefix`: string, default `Yaxii`
- `officeWordingMode`: `office_delivery`, `stopdesk`, `bureau`, or `custom`
- `officeCustomLabel`: string
- `methods`: fixed method templates
- `safetyPolicy`: locked safety rules

Currency is not user-editable and is not persisted. The UI displays:

```text
Currency comes from WooCommerce. Fallback: DZD.
```

## Dataset Modes

Current mode is available as `Current Algeria dataset`.

Legacy mode remains visible in the UI but unavailable as `Legacy 58-compatible dataset` with the reason:

```text
Legacy mapping is not available yet.
```

Saving `datasetMode: legacy_58` is rejected until an auditable mapping exists. If an older stored option contains `legacy_58`, the repository normalizes it back to `current` and returns a warning.

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

Home delivery and office/stopdesk delivery are required and locked on. Custom method 1 and custom method 2 are optional.

Unlimited custom methods are not in the MVP because the preview planner and safe apply engine need a small, auditable method contract before they write WooCommerce shipping methods.

Each method template has:

- `key`
- `enabled`
- `label`
- `defaultPrice`
- `type: flat_rate`
- `locked`

Default prices may be numbers or `null`. Negative prices are rejected locally and by the REST sanitizer.

## Locked Safety Policy

These safety rules are always locked on in the MVP:

- `protectManualZones`
- `requirePreviewBeforeApply`
- `skipConflictsByDefault`
- `neverDeleteManualZones`

The REST sanitizer forces all safety rules back to `true`. The UI copy says these are required safety rules for the safe apply engine.

## Wizard Contract

Wizard steps:

1. Setup path
2. Dataset mode
3. Label/naming
4. Shipping methods
5. Default prices
6. Wilaya selection
7. Review draft

The wizard initializes from persisted settings. Wilaya selection and per-wilaya draft prices remain local draft UI state.

The review screen must say:

```text
This is a local draft. WooCommerce preview/apply will be added after diagnostics and preview planner.
```

## Still Draft Or Local

- Wizard state after launch.
- Wilaya enabled/disabled choices.
- Per-wilaya method prices.
- CSV import/export flow.
- Future preview/apply state.

## Not Implemented Yet

TASK-003B does not implement:

- WooCommerce zone reads or writes.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply updates beyond creating missing managed zones.
- CSV backend.
- YSF sync.
- Provider imports.
- Commune-level pricing.
- Unlimited custom shipping methods.
- Country expansion UI.
