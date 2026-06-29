# Shipping Zones Management Center

The Shipping Zones tab is a live status and supported-change management center.

It is not a direct WooCommerce write surface. Supported writes still go through preview/apply and the existing `SafeApplyEngine`.

## Live Status

Rows combine the current wilaya dataset with read-only WooCommerce diagnostics.

The page shows:

- a reference-based management page with the table as the primary workspace
- a compact live status card with active wilayas, managed methods, pending changes, and protected manual zones
- secondary actions for diagnostics and WooCommerce's native shipping settings
- search by wilaya name, Arabic name, or code
- filters for all, active, pending changes, needs update, missing setup, and protected/manual rows
- whether a direct WooCommerce zone exists for the wilaya
- whether the zone is recorded in the Yaxii managed registry
- simple row status such as `Active`, `Missing setup`, `Needs update`, `Conflict detected`, `Protected manual zone`, or `Not managed`
- home and office live flat-rate method prices when the methods are registry-owned
- technical zone and ownership details only after the merchant opens row details
- a `Repair setup` action when a row is missing its Yaxii-managed WooCommerce setup

Diagnostics remain read-only. They do not create, update, or delete zones or methods.

## Supported Pending Changes

Price inputs create pending changes for Yaxii-managed method instances only.

Supported actions:

- edit a registry-owned Home delivery price
- edit a registry-owned Office delivery price
- enable or disable an existing registry-owned Home delivery method
- enable or disable an existing registry-owned Office delivery method
- disable a wilaya by disabling all existing Yaxii-managed methods for that wilaya
- enable a wilaya by enabling all existing Yaxii-managed methods for that wilaya
- set selected registry-owned prices to `0` with the selected-row `Make free` quick tool
- bulk-set selected registry-owned Home, Office, or both method prices
- bulk-set selected registry-owned Home, Office, or both methods to free shipping
- bulk-enable or bulk-disable selected registry-owned methods
- use the row-level active control to enable or disable all existing managed methods for one wilaya
- adjust selected prices by percent, fixed amount, or rounding as local pending changes
- copy selected Home prices to Office or Office prices to Home as local pending changes
- review pending changes through a focused price-update dialog
- clear pending changes before review

Required copy:

```text
Changes will be reviewed before WooCommerce is updated.
```

Review/apply uses the same preview endpoint and apply endpoint as the Generator. The table does not create a second apply engine.

The review dialog shows only:

- affected wilaya
- affected method
- old price or status
- new price or status
- safety copy that WooCommerce will be checked again and manual zones will not be touched

It does not show preview hashes, contract versions, zone IDs, method instance IDs, raw preview groups, or other backend details.

Free shipping is represented as price `0`. Method cells display `Free` and old price -> `Free` when pending, but they do not show a permanent per-cell free toggle. Merchants use the selected-row quick tools for bulk free-shipping changes.

Enable/disable changes are represented as method status changes, not deletes. Method cells do not show active enable/disable switches; disabled methods keep their price visible in a muted state with a `Disabled` badge. Merchants enable or disable methods from the selected-row quick tools, or disable the whole wilaya with the row-level active control. A disabled method instance remains in WooCommerce with its stored price and registry record intact. Pending method status changes display as `Enabled -> Disabled` or `Disabled -> Enabled` and are written only after preview/apply revalidates the managed zone and method.

## Missing Setup Repair

`Missing setup` means WooCommerce data is missing or incomplete for a Yaxii-managed wilaya. This can happen when:

- the direct Yaxii-managed WooCommerce zone is missing
- the managed registry points to a zone or method that WooCommerce no longer returns
- one or more required Yaxii-managed methods are missing from a managed zone

Missing rows keep price inputs disabled. Row details explain:

```text
This wilaya is missing its Yaxii-managed zone or methods.
```

Single missing rows show `Repair setup`. Selecting one or more missing rows shows `Repair selected`.

Repair uses the existing preview/apply path:

- the selected missing wilayas are previewed again
- current Home/Office default prices from settings are used for missing methods
- WooCommerce is re-read before apply
- safe previews can create missing managed zones or add missing managed methods through `SafeApplyEngine`
- diagnostics refresh after a successful repair

Repair does not bypass preview/apply and does not write directly from the table.

If a missing-looking wilaya also has a duplicate/manual conflict, the row is treated as `Conflict detected` or `Protected manual zone`; direct repair is not offered and the merchant is sent to Diagnostics.

## Unsupported Actions

Unsupported actions must be hidden, disabled, or labeled as later work:

- updating manual or unknown methods
- updating manual or unknown zones
- adopting manual zones
- updating zone names
- deleting zones or methods

For protected rows:

```text
Protected manual zone
```

## Supported Actions

The table routes merchants to:

- `Open Generator`
- `Diagnostics`
- `WooCommerce zones`
- `Repair setup`
- `Repair selected`
- `Save changes`
- `Update prices`
- `Update status`
- `Clear changes`

`Open WooCommerce zones` opens WooCommerce's native shipping settings in a new browser tab for inspection.

## Current Limitations

- The table does not write directly to WooCommerce.
- It does not update zone names.
- It does not update manual or unknown zones or methods.
- It does not delete zones or methods.
- It does not adopt manual zones.
- It does not create missing methods through enable/disable controls; missing setup uses the repair flow.
