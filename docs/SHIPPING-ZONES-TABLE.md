# Shipping Editor Management Center

The Shipping Editor tab is a live status and supported-change management center.

It is not a direct WooCommerce write surface. Supported writes still go through preview/apply and the existing `SafeApplyEngine`.

## Live Status

Rows combine the current wilaya dataset with read-only WooCommerce diagnostics.

The page shows:

- a reference-based management page with the table as the primary workspace when a Yaxii-managed setup exists
- a compact live status card with active wilayas, managed methods, pending changes, and manual zones
- a strong empty setup state when the managed registry is empty and most or all wilayas are missing
- secondary actions for diagnostics and WooCommerce's native shipping settings
- search by wilaya name, Arabic name, or code
- filters for all, active, pending changes, needs update, missing setup, and manual/not-managed rows
- whether a direct WooCommerce zone exists for the wilaya
- whether the zone is recorded in the Yaxii managed registry
- simple row status such as `Active`, `Partially active`, `Methods disabled`, `Missing setup`, `Needs update`, `Updating...`, `Conflict detected`, `Manual zone`, or `Not managed by Yaxii`
- home and office live flat-rate method prices when the methods are registry-owned
- technical zone and ownership details only after the merchant opens row details
- a `Repair setup` action when a row is missing its Yaxii-managed WooCommerce setup

Diagnostics remain read-only. They do not create, update, or delete zones or methods.

## Empty Setup State

When diagnostics report an empty Yaxii managed registry, no active managed rows, and most or all dataset wilayas missing, the page leads with a setup state instead of a table full of `Missing setup` rows:

```text
No shipping setup yet
Generate Yaxii-managed WooCommerce shipping zones, then manage prices and methods from this page.
```

The primary action is `Generate shipping zones`. It opens Generator in the normal create setup flow.

After Generator successfully applies a setup and the merchant returns to Shipping Editor, the app refreshes diagnostics so newly generated WooCommerce zones appear without requiring a browser refresh.

The secondary action is `View all wilayas`. It reveals the full table for inspection and partial repair work.

The full table and row-level `Repair setup` buttons are hidden until the merchant chooses `View all wilayas`.

Manual WooCommerce zones do not block this empty setup state. If manual zones exist, the state shows protected manual-zone copy. If no manual zones exist, no manual-zone warning is shown.

If Diagnostics detects an existing Yaxii COD Theme shipping setup, Shipping Editor shows a non-blocking read-only hint:

```text
Existing Yaxii COD shipping setup detected. Some wilayas are read-only to prevent duplicate zones. Review Diagnostics before generating new zones.
```

The hint does not adopt theme zones and does not edit theme-owned WooCommerce zones.

When compatibility findings map to the current wilaya dataset, rows use read-only external status labels:

- `Created by Yaxii COD Theme`: the normalized wilaya is covered by Yaxii COD Theme and no Yaxii Shipping Manager managed zone covers it.
- `Duplicate zone`: the normalized wilaya is covered by both Yaxii Shipping Manager and Yaxii COD Theme.
- `External Yaxii zone`: the normalized wilaya has external Yaxii-looking coverage but no Yaxii Shipping Manager registry record.

These rows:

- are not treated as plain `Missing setup`;
- do not show editable price inputs;
- do not allow status toggles or bulk actions;
- do not show `Repair setup`;
- show read-only source details when available: source, zone ID, zone name, location format, and method count;
- route actions to `Review in Diagnostics` and `Open WooCommerce zones`.

Duplicate rows show this warning copy:

```text
This wilaya is covered by both Yaxii Shipping Manager and Yaxii COD Theme.
```

Partial setup is different: when some Yaxii-managed rows exist and some rows are missing, the table remains the primary workspace and the row-level `Repair setup` plus selected-row `Repair selected` actions remain visible.

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

After a successful apply, affected wilaya/method rows show `Updating...` while diagnostics refreshes. During that verification window the table suppresses stale `Needs update` labels for the affected rows. If diagnostics cannot be refreshed, the page shows:

```text
Update sent, but verification failed. Refresh diagnostics.
```

If refreshed diagnostics confirms the requested value, the row returns to its current managed status without falling back to a stale default-vs-live `Needs update` label for that applied method. If refreshed diagnostics still differs from the requested change, the row returns to `Needs update` and the merchant can review the change again.

The review dialog shows only:

- affected wilaya
- affected method
- old price or status
- new price or status
- safety copy that WooCommerce will be checked again and manual zones will not be touched

It does not show preview hashes, contract versions, zone IDs, method instance IDs, raw preview groups, or other backend details.

Free shipping is represented as price `0`. Method cells display `Free` and old price -> `Free` when pending, but they do not show a permanent per-cell free toggle. Merchants use the selected-row quick tools for bulk free-shipping changes.

Enable/disable changes are represented as method status changes, not deletes. Method cells do not show active enable/disable switches; disabled methods keep their price visible in a muted state with a `Disabled` badge. Merchants enable or disable methods from the selected-row quick tools, or disable the whole wilaya with the row-level active control. A disabled method instance remains in WooCommerce with its stored price and registry record intact. Pending method status changes display as `Enabled -> Disabled` or `Disabled -> Enabled` and are written only after preview/apply revalidates the managed zone and method.

Row status follows the managed method state:

- all registry-owned managed methods enabled and prices aligned: `Active`
- all registry-owned managed methods disabled: `Methods disabled`
- mixed enabled and disabled registry-owned managed methods: `Partially active`

Disabled methods are not treated as missing setup and do not imply a price update unless a supported pending or verified saved price difference is present on an enabled managed method.

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
- pricing rows send `methodStatuses` as an object, using an empty object when no status changes are needed
- WooCommerce is re-read before apply
- safe previews can create missing managed zones or add missing managed methods through `SafeApplyEngine`
- diagnostics refresh after a successful repair

Repair does not bypass preview/apply and does not write directly from the table.

If a missing-looking wilaya also has a duplicate/manual conflict, the row is treated as `Conflict detected` or `Manual zone`; direct repair is not offered and the merchant is sent to Diagnostics.

## Unsupported Actions

Unsupported actions must be hidden, disabled, or labeled as later work:

- updating manual or unknown methods
- updating manual or unknown zones
- adopting manual zones
- updating zone names
- deleting zones or methods

For manual or unknown rows:

```text
This zone is not managed by Yaxii. Yaxii will not edit it.
```

Manual/protected row details are read-only. They show the WooCommerce zone name, matched wilaya code, method names, method prices, and enabled/disabled status when WooCommerce returns that data. The only actions are `Open WooCommerce zones` and `Review in Diagnostics`.

Yaxii COD Theme, external Yaxii, and duplicate rows follow the same read-only protection boundary as manual rows. They are not adopted, converted, repaired, deleted, or edited from Shipping Editor.

## Supported Actions

The table routes merchants to:

- `Open Generator`
- `Review in Diagnostics`
- `WooCommerce zones`
- `Review changes`
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
