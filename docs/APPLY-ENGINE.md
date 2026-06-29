# Safe Apply Engine

## Current Scope

TASK-008C enables the next narrow WooCommerce write path:

- Create missing Yaxii-managed shipping zones from the fresh preview `createZones` group.
- Add enabled `flat_rate` shipping method instances with prices to Yaxii-managed zones only.
- Update labels and costs for existing `flat_rate` method instances only when the target method is already recorded in the Yaxii managed registry.
- Enable or disable existing registry-owned `flat_rate` method instances from fresh `updateMethodStatuses` items.
- Record created zones and method instances in `yaxii_shipping_manager_managed_zones`.
- Return a clear apply result with created, updated, skipped, blocked, warning, registry, and WooCommerce-change fields.

This task does not update existing zone names, delete zones, delete methods, adopt manual zones, reset/wipe setup, or modify checkout fields.

## Endpoint

```text
POST /wp-json/yaxii-shipping-manager/v1/apply
```

Access requires the protected admin policy and a valid WordPress REST nonce:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: blocked before any write
- `X-WP-Nonce` is required

## Request Contract

The apply request uses the existing apply confirmation fields plus the preview request snapshot that produced the reviewed preview:

- `previewHash`
- `previewGeneratedAt`
- `selectedWilayaCodes`
- `acceptedPlanSummary`
- `confirmed`
- `confirmationText`: `APPLY YAXII SHIPPING PLAN`
- `safetyPolicySnapshot`
- `applyContractVersion`: `apply-contract-v1`
- `previewRequest`

The `previewRequest` snapshot is sanitized through the preview request sanitizer. Its `selectedWilayaCodes` must match the apply request `selectedWilayaCodes`.

## Revalidation Before Write

The apply endpoint does not trust a submitted preview hash by itself.

Before creating or updating any zone or method, the engine:

1. Sanitizes the apply payload.
2. Re-reads WooCommerce diagnostics through the preview planner.
3. Regenerates the preview from `previewRequest`.
4. Compares the fresh `previewHash` with the submitted `previewHash`.
5. Compares the fresh summary with `acceptedPlanSummary`.
6. Blocks if readiness is blocked or conflicts exist.
7. Creates only fresh `createZones` items.
8. Adds methods only from fresh create-zone method data or fresh `addMethods` items.
9. Updates method labels and prices only from fresh `updateMethods` items whose target zone and method are registry-owned.
10. Updates method enabled status only from fresh `updateMethodStatuses` items whose target zone and method are registry-owned.

This re-read happens immediately before the WooCommerce write loop.

## Zone Creation

Each created zone uses the previewed `zoneName` and one state location:

```text
DZ:NN
```

The engine appends zones after existing WooCommerce zones by assigning the next zone order. After WooCommerce returns a zone ID, the registry records the zone before method creation is attempted.

## Method Creation

The apply engine can add or update enabled `flat_rate` method instances for these fixed method keys:

- `home_delivery`
- `office_delivery`
- `custom_1`
- `custom_2`

Rules:

- Methods are added only to zones recorded in the managed registry.
- The registry record must match the target wilaya code.
- The WooCommerce zone ID must still exist.
- The WooCommerce zone must still contain the expected `DZ:NN` state location.
- The preview item must have `ownershipSource: managed_registry`.
- Existing registry-recorded method keys are skipped, not duplicated.
- Manual or unknown zones are not touched.

New flat-rate method settings use:

- `title`: method label from the wizard.
- `cost`: selected wilaya price, or method default price as resolved by the preview planner.

Price `0` is valid. Missing, invalid, or negative prices are rejected or skipped safely.

## Method Updates

TASK-008C can update an existing method label or cost only when all ownership checks pass:

- The preview item is a fresh `method_update` item.
- The preview item has `ownershipSource: managed_registry`.
- The target zone ID is recorded in `yaxii_shipping_manager_managed_zones`.
- The registry wilaya code matches the preview wilaya code.
- The WooCommerce zone still exists.
- The WooCommerce zone still has the expected `DZ:NN` state location.
- The target method key is already recorded in the registry for that zone.
- The recorded WooCommerce method instance still exists in that same zone.
- The recorded method and current WooCommerce method are `flat_rate`.

Successful updates write only the WooCommerce instance `title` and `cost`, then update the registry method record `title` and `lastKnownCost` and the zone record `updatedAt`.

If any ownership, location, method, or price check fails, the method update is skipped and reported. The engine does not adopt manual methods, search for replacement methods, delete methods, or update unknown instances.

## Method Status Updates

TASK-010G can enable or disable an existing method only when all ownership checks pass:

- The preview item is a fresh `method_status_update` item.
- The preview item has `ownershipSource: managed_registry`.
- The target zone ID is recorded in `yaxii_shipping_manager_managed_zones`.
- The registry wilaya code matches the preview wilaya code.
- The WooCommerce zone still exists.
- The WooCommerce zone still has the expected `DZ:NN` state location.
- The target method key is already recorded in the registry for that zone.
- The recorded WooCommerce method instance still exists in that same zone.
- The recorded method and current WooCommerce method are `flat_rate`.

Successful status updates write only WooCommerce's zone-method `is_enabled` flag for the verified `zone_id`, `instance_id`, and `flat_rate` method row, then update the registry method record `enabled` and the zone record `updatedAt`.

Disabling a method does not delete the method, does not clear its stored price, and does not remove registry records. Disabling a wilaya means disabling its existing Yaxii-managed methods; it does not delete or disable the WooCommerce zone itself.

## Managed Registry

Created zones and methods are recorded in:

```text
yaxii_shipping_manager_managed_zones
```

Each zone record includes:

- `wilayaCode`
- `zoneId`
- `zoneName`
- `methodInstances`
- `createdBy`
- `createdAt`
- `updatedAt`
- `source`
- `schemaVersion`

Each method instance record includes:

- `methodKey`
- `instanceId`
- `methodId`
- `title`
- `lastKnownCost`
- `enabled`

The option is written with autoload disabled. The registry does not store dataset rows, secrets, raw preview payloads, or unrelated WooCommerce data.

## Response

The response includes:

- `applyEngineAvailable: true`
- `applied`
- `createdZones`
- `createdMethods`
- `updatedMethods`
- `skippedZones`
- `skippedMethods`
- `skippedMethodUpdates`
- `blockedZones`
- `conflicts`
- `warnings`
- `registryUpdated`
- `wooCommerceChanged`
- `previewHash`
- `applyContractVersion`
- `message`

If no supported change is made, `applied` is `false`, `wooCommerceChanged` is `false`, and `message` is `No supported changes were needed.`

## Safety Blocks

Apply is blocked when:

- WooCommerce is inactive.
- The preview hash is stale or does not match the regenerated preview.
- The accepted summary no longer matches.
- Readiness is blocked.
- Conflicts exist.
- Selected wilayas are missing.
- Safety policy values are not locked to `true`.
- Planned deletes are present.
- The preview contains only unsupported updates.
- The current user lacks permission or the REST nonce is invalid.

Manual or unknown zones in `skipManualZones` are not touched.

## Not Implemented

TASK-008C does not implement:

- Updating WooCommerce shipping zones.
- Deleting WooCommerce shipping zones.
- Deleting shipping methods.
- Adopting manual zones.
- Reset or wipe tools.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
