# Shipping Zones Table

The Shipping Zones table is a live status and draft planning screen.

It is not a direct WooCommerce write surface.

## Live Status

Rows combine the current wilaya dataset with read-only WooCommerce diagnostics.

The table can show:

- whether a direct WooCommerce zone exists for the wilaya
- whether the zone is recorded in the Yaxii managed registry
- whether the zone is only a weak Yaxii-looking name match
- whether the zone is manual or unknown
- duplicate or manual conflict status
- home and office method enabled state
- live flat-rate method cost when the method is registry-owned

Diagnostics remain read-only. They do not create, update, or delete zones or methods.

## Draft Controls

Price inputs, draft row toggles, bulk price tools, percent changes, free shipping, and disable actions update local draft state only.

Required copy:

```text
Draft only - use Preview & Apply to update WooCommerce.
```

The table must not use labels like `Save`, `Apply`, `Disable`, or `Make free` unless the action actually goes through the safe preview/apply contract.

## Supported Actions

The table may route merchants to:

- `Open Generator to update prices`
- `Preview missing setup`
- `Check diagnostics`
- `Open WooCommerce zones`

WooCommerce writes must still go through Generator preview/apply and the existing `SafeApplyEngine`.

## Current Limitations

- The table does not apply changes directly.
- It does not update zone names.
- It does not update manual or unknown zones or methods.
- It does not delete zones or methods.
- It does not adopt manual zones.
