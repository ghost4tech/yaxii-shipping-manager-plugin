# Shipping Zones Management Center

The Shipping Zones tab is a live status and supported-change management center.

It is not a direct WooCommerce write surface. Supported writes still go through preview/apply and the existing `SafeApplyEngine`.

## Live Status

Rows combine the current wilaya dataset with read-only WooCommerce diagnostics.

The table shows:

- whether a direct WooCommerce zone exists for the wilaya
- whether the zone is recorded in the Yaxii managed registry
- simple row status such as `Active`, `Missing setup`, `Needs update`, `Manual conflict`, `Protected`, or `Not managed`
- home and office live flat-rate method prices when the methods are registry-owned
- technical zone and ownership details only after the merchant opens row details

Diagnostics remain read-only. They do not create, update, or delete zones or methods.

## Supported Pending Changes

Price inputs create pending changes for Yaxii-managed method instances only.

Supported actions:

- edit a registry-owned Home delivery price
- edit a registry-owned Office delivery price
- set a registry-owned price to `0` with `Make free`
- bulk-set a selected registry-owned method price
- review pending changes through the existing preview/apply panel
- clear pending changes before review

Required copy:

```text
Changes will be reviewed before WooCommerce is updated.
```

Review/apply uses the same preview endpoint and apply endpoint as the Generator. The table does not create a second apply engine.

## Unsupported Actions

Unsupported actions must be hidden, disabled, or labeled as later work:

- enabling or disabling methods
- enabling or disabling rows
- updating manual or unknown methods
- updating manual or unknown zones
- adopting manual zones
- updating zone names
- deleting zones or methods

Current copy:

```text
Enable/disable will be added later. Prices can be updated now.
```

For protected rows:

```text
Manual methods are protected. Use WooCommerce to edit them.
```

## Supported Actions

The table routes merchants to:

- `Open Generator`
- `Check diagnostics`
- `Open WooCommerce zones`
- `Review changes`
- `Clear changes`

`Open WooCommerce zones` opens WooCommerce's native shipping settings in a new browser tab for inspection.

## Current Limitations

- The table does not write directly to WooCommerce.
- It does not update zone names.
- It does not update manual or unknown zones or methods.
- It does not delete zones or methods.
- It does not adopt manual zones.
