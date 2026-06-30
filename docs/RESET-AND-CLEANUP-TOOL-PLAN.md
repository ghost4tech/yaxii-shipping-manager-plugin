# Reset and Cleanup Tool Plan

## Purpose

Future tool name:

```text
Remove Yaxii-managed setup
```

The tool is for repeat testing, agency setup cleanup, and controlled removal of setup created by Yaxii Shipping Manager. TASK-012F implements the read-only dry-run preview only; actual removal is still not implemented.

## Location

Recommended location:

- `Settings -> Advanced tools`

Alternative acceptable location:

- `Diagnostics -> Advanced tools`

Do not place this as a top-level navigation item for the free MVP.

## Scope

The future tool may remove only Yaxii-managed WooCommerce shipping data recorded in:

```text
yaxii_shipping_manager_managed_zones
```

It must never remove manual WooCommerce zones.

## Implemented Dry-run

TASK-012F adds this read-only endpoint:

```text
GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview
```

The endpoint reads the managed registry and WooCommerce shipping zone snapshots, then shows exact counts:

- managed zones to remove
- managed methods to remove
- manual zones protected
- registry records to clear or reconcile
- conflicts or registry mismatches

The dry-run must list the specific managed zone IDs and method instance IDs it plans to remove. Manual zone IDs may be shown as protected for review, but they must not be removable from this tool.

The response always includes:

- `removalAvailable: false`
- `dryRunOnly: true`
- `requiredConfirmationText: REMOVE YAXII SETUP`
- `message`
- candidate `zonesToRemoveLater`
- candidate `methodsToRemoveLater`
- protected `manualZonesProtected`
- `registryWarnings`
- `blockingReasons`

No delete, clear, reconcile, or write action exists in TASK-012F.

## Confirmation

Removal must require typed confirmation:

```text
REMOVE YAXII SETUP
```

The confirmation screen must repeat that manual zones are protected and that only registry-owned Yaxii-managed zones and methods are in scope.

## Safety Blocks

The tool must block removal when:

- the managed registry references zones that WooCommerce no longer returns
- WooCommerce returns matching zones that are not in the managed registry
- duplicate direct-zone conflicts exist for managed wilayas
- a registry record has a method instance mismatch
- the dry-run cannot prove ownership from `yaxii_shipping_manager_managed_zones`
- the current user lacks the required capability
- the REST nonce is invalid
- WooCommerce is inactive

If registry mismatch is detected, a separate repair/reconcile flow must exist before removal can continue.

## Removal Rules

If implemented later, the removal engine must:

- re-read WooCommerce zones immediately before writing
- remove only managed zones and methods recorded in the registry
- never remove manual or unknown zones
- never adopt manual zones
- report every removed, skipped, blocked, and failed item
- keep the operation idempotent where possible
- refresh diagnostics after removal
- clear or reconcile registry records only after verified WooCommerce changes
- log partial failures without hiding them

## REST Boundary

The TASK-012F dry-run endpoint exists and is read-only. It uses the same protected admin policy as diagnostics and settings:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`

It does not require a typed confirmation because it cannot write. The future removal endpoint must be separate from the existing apply endpoint and must require:

- a permission callback
- a valid WordPress REST nonce
- `manage_woocommerce` when WooCommerce is active
- typed confirmation
- a dry-run hash or equivalent stale-preview protection

## WordPress.org Notes

The tool must stay transparent and local-first:

- no telemetry
- no remote calls
- no provider API calls
- no licensing gate
- no Pro lock
- no hidden tracking
- no external assets

## Open Questions

- Should removal delete full managed zones, or remove only managed methods when a zone contains non-Yaxii methods?
- Should registry reconciliation be a separate diagnostic action before removal?
- Should the tool create an exportable cleanup report for agency handoff?
- Should cleanup be available only when `WP_DEBUG` is enabled during early testing, or should it be visible under Advanced tools for all administrators?
