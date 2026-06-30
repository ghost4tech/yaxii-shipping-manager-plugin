# Reset and Cleanup Tool Plan

## Purpose

Tool name:

```text
Remove Yaxii-managed setup
```

The tool is for repeat testing, agency setup cleanup, and controlled removal of setup created by Yaxii Shipping Manager. It removes only Yaxii-managed WooCommerce shipping setup proven by the managed registry.

## Location

Implemented location:

- `Settings -> Advanced tools`

Do not place this as a top-level navigation item for the free MVP.

## Scope

The tool may remove only Yaxii-managed WooCommerce shipping data recorded in:

```text
yaxii_shipping_manager_managed_zones
```

It must never remove manual WooCommerce zones, manual methods, unknown zones, unknown methods, settings, datasets, plugin files, or unrelated WooCommerce shipping configuration.

## Dry-run Endpoint

The dry-run endpoint is:

```text
GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview
```

The endpoint reads the managed registry and WooCommerce shipping zone snapshots, then returns:

- `removalAvailable`
- `dryRunOnly: true`
- `managedZoneCount`
- `managedMethodCount`
- `missingManagedZoneCount`
- `missingManagedMethodCount`
- `manualProtectedZoneCount`
- `registryMismatchCount`
- `zonesToRemoveLater`
- `methodsToRemoveLater`
- `manualZonesProtected`
- `orphanRegistryRecords`
- `orphanMethodRecords`
- `blockedZones`
- `registryWarnings`
- `blockingReasons`
- `requiredConfirmationText: REMOVE YAXII SETUP`
- `acceptedSummary`
- `dryRunHash`
- `dryRunGeneratedAt`

Each zone candidate includes the WooCommerce zone ID, zone name, wilaya code, registry status, live method count, registry-owned method count, unmanaged method count, `canRemove`, and blocking reasons.

Manual zone IDs may be shown as protected for review, but they must not be removable from this tool.

## Execution Endpoint

The confirmed removal endpoint is:

```text
POST /wp-json/yaxii-shipping-manager/v1/managed-setup/remove
```

The request must include:

- `confirmed: true`
- `confirmationText: REMOVE YAXII SETUP`
- `dryRunHash`
- `dryRunGeneratedAt`
- `acceptedSummary`

The endpoint requires the same protected admin capability policy as other admin endpoints and a valid WordPress REST nonce. WooCommerce inactive blocks removal.

Before deleting anything, the endpoint re-runs the dry-run and compares the submitted hash and summary with the fresh preview. If WooCommerce changed after the preview, removal is rejected and no delete runs.

## Confirmation

Removal requires typed confirmation:

```text
REMOVE YAXII SETUP
```

The UI repeats:

- `This removes only Yaxii-managed WooCommerce zones and methods.`
- `Manual WooCommerce zones will not be touched.`
- `This cannot be undone from Yaxii.`
- `Use this only for testing, cleanup, or starting over.`

## Safety Rules

A Yaxii-managed zone can be removed only if:

- it exists in WooCommerce
- it is recorded in the managed registry
- its registry wilaya code matches the expected `state:DZ:NN` WooCommerce zone location
- all live methods in that zone are registry-owned Yaxii-managed methods
- there are no unmanaged/manual methods inside that managed zone

If a managed zone contains unmanaged methods, the zone is blocked and the UI reports:

```text
This Yaxii-managed zone contains methods not recorded by Yaxii. Remove or review them in WooCommerce first.
```

Manual zones are listed only under `manualZonesProtected`.

## Removal Rules

The removal engine:

- deletes verified removable managed zones through WooCommerce shipping zone APIs
- relies on WooCommerce zone deletion to remove methods inside verified managed zones
- does not separately delete manual methods
- does not delete any zone with unmanaged methods
- removes registry records for deleted zones
- cleans orphan registry records for WooCommerce zones or methods that are already missing, but only after confirmed removal
- never clears the full settings option, dataset files, plugin files, or unrelated WooCommerce data
- reports deleted zones, estimated deleted methods, registry records removed, orphan records cleaned, protected manual zones, blocked zones, warnings, and a merchant-facing message

## WordPress.org Notes

The tool stays transparent and local-first:

- no usage tracking
- no remote calls
- no provider API calls
- no licensing gate
- no Pro lock
- no hidden tracking
- no external assets

## Still Not Implemented

- exportable cleanup reports
- a separate registry reconciliation screen
- restoring removed setup automatically after cleanup
- deletion of partially managed zones that contain unmanaged methods
