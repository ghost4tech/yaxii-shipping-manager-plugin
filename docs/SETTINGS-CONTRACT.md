# Settings and Wizard Contract

## Current Position

TASK-003B persists the MVP settings contract in WordPress options and exposes read/write REST endpoints for the admin app.

The settings remain defaults for future setup previews. They do not create, update, delete, or inspect WooCommerce shipping zones.

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

Unknown keys are rejected on save. Invalid enum values, duplicate method keys, negative prices, and unsupported method types are returned as REST errors.

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

The Settings page is labeled:

```text
Defaults for future setup
```

The primary save action is:

```text
Save defaults
```

Successful saves show:

```text
Defaults saved. Existing WooCommerce shipping zones were not changed.
```

Method labels and default prices are future setup defaults. The UI directs merchants to Shipping Editor for live WooCommerce price updates. Naming controls also state that existing WooCommerce zone names are not changed by saving settings.

## Advanced Tools

Settings includes an `Advanced tools` section.

The first tool is:

```text
Remove Yaxii setup
```

The visible action is:

```text
Remove Yaxii setup
```

Settings checks the removal preview endpoint so it can show `No Yaxii setup found.` when there is nothing Yaxii-managed to remove.

Opening the confirmation modal, or refreshing the tool status, calls:

```text
GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview
```

The main UI shows only:

- Yaxii-managed zones to remove
- manual zones protected
- warnings/blockers

Detailed candidates, warnings, blockers, protected manual zones, and method records are hidden under:

```text
View technical details
```

The modal copy is:

```text
Remove Yaxii setup?
This removes only Yaxii-managed WooCommerce shipping zones and methods. Manual WooCommerce zones will not be touched.
You can generate a new Yaxii setup again later.
```

When the preview has removable Yaxii-managed candidates and no blockers, the user must type `REMOVE`. The client maps that visible confirmation to the backend-required `REMOVE YAXII SETUP` value when sending the request.

The confirmed action calls:

```text
POST /wp-json/yaxii-shipping-manager/v1/managed-setup/remove
```

The request includes the dry-run hash, generated timestamp, and accepted summary counts. The backend re-runs the dry-run before deleting anything and rejects stale or mismatched previews.

The UI copy must say:

- `This removes only Yaxii-managed WooCommerce zones and methods.`
- `Manual WooCommerce zones will not be touched.`
- `You can generate a new Yaxii setup again later.`
- `Yaxii setup removed. Manual WooCommerce zones were not touched.`

If blockers exist, no confirm removal button is shown. The UI says `Yaxii setup cannot be safely removed yet.` and exposes blocker data only inside `View technical details`. Manual zones remain protected and are never candidates.

## Dataset Modes

Available modes:

- `current`: `Current Algeria dataset`
- `legacy_58`: `Legacy 58-compatible dataset`

Saving `datasetMode: legacy_58` is allowed. The mode is generated from the current normalized dataset by filtering wilaya codes `01` through `58`; it is derived from user-verified first 58 records and is not independently verified as official/legal administrative truth.

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

1. Coverage
2. Methods and prices
3. Names
4. Preview
5. Generate

The wizard initializes from persisted settings. Dataset mode, wilaya selection, method choices, and per-wilaya prices remain local draft UI state until Preview/Generate.

Saving settings alone does not write WooCommerce shipping zones or methods.

## Still Draft Or Local

- Wizard state after launch.
- Wilaya enabled/disabled choices.
- Per-wilaya method prices.
- CSV import/export flow.
- Future preview/apply state.
- Exportable cleanup reports for `Remove Yaxii-managed setup`.

## Not Implemented Yet

TASK-003B does not implement:

- WooCommerce zone reads or writes.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply updates beyond creating missing managed zones and adding methods to managed zones.
- Partial removal of managed zones that contain unmanaged/manual methods.
- CSV backend.
- YSF sync.
- Provider imports.
- Commune-level pricing.
- Unlimited custom shipping methods.
- Country expansion UI.
