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

Diagnostics remain read-only. They do not create, update, or delete zones or methods.

## Supported Pending Changes

Price inputs create pending changes for Yaxii-managed method instances only.

Supported actions:

- edit a registry-owned Home delivery price
- edit a registry-owned Office delivery price
- set a registry-owned price to `0` with the `Free shipping` switch
- bulk-set selected registry-owned Home, Office, or both method prices
- bulk-set selected registry-owned Home, Office, or both methods to free shipping
- review pending changes through a focused price-update dialog
- clear pending changes before review

Required copy:

```text
Changes will be reviewed before WooCommerce is updated.
```

Review/apply uses the same preview endpoint and apply endpoint as the Generator. The table does not create a second apply engine.

The price-update dialog shows only:

- affected wilaya
- affected method
- old price
- new price
- safety copy that WooCommerce will be checked again and manual zones will not be touched

It does not show preview hashes, contract versions, zone IDs, method instance IDs, raw preview groups, or other backend details.

## Unsupported Actions

Unsupported actions must be hidden, disabled, or labeled as later work:

- enabling or disabling methods
- enabling or disabling rows
- updating manual or unknown methods
- updating manual or unknown zones
- adopting manual zones
- updating zone names
- deleting zones or methods

Enable/disable state may appear as a disabled, read-only visual control when diagnostics exposes method status. The control must use this copy and must not write until a safe backend task exists:

```text
Enable/disable coming later
```

For protected rows:

```text
Protected manual zone
```

## Supported Actions

The table routes merchants to:

- `Open Generator`
- `Diagnostics`
- `WooCommerce zones`
- `Save changes`
- `Update prices`
- `Clear changes`

`Open WooCommerce zones` opens WooCommerce's native shipping settings in a new browser tab for inspection.

## Current Limitations

- The table does not write directly to WooCommerce.
- It does not update zone names.
- It does not update manual or unknown zones or methods.
- It does not delete zones or methods.
- It does not adopt manual zones.
- It does not enable or disable shipping methods.
