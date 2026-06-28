# Safe Apply Engine

## Current Scope

TASK-008B enables the second narrow WooCommerce write path:

- Create missing Yaxii-managed shipping zones from the fresh preview `createZones` group.
- Add enabled `flat_rate` shipping method instances with prices to Yaxii-managed zones only.
- Record created zones and method instances in `yaxii_shipping_manager_managed_zones`.
- Return a clear apply result with created, skipped, blocked, warning, registry, and WooCommerce-change fields.

This task does not update existing zone names, update existing method instances, delete zones, delete methods, adopt manual zones, or modify checkout fields.

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

Before creating any zone or method, the engine:

1. Sanitizes the apply payload.
2. Re-reads WooCommerce diagnostics through the preview planner.
3. Regenerates the preview from `previewRequest`.
4. Compares the fresh `previewHash` with the submitted `previewHash`.
5. Compares the fresh summary with `acceptedPlanSummary`.
6. Blocks if readiness is blocked or conflicts exist.
7. Creates only fresh `createZones` items.
8. Adds methods only from fresh create-zone method data or fresh `addMethods` items.

This re-read happens immediately before the WooCommerce write loop.

## Zone Creation

Each created zone uses the previewed `zoneName` and one state location:

```text
DZ:NN
```

The engine appends zones after existing WooCommerce zones by assigning the next zone order. After WooCommerce returns a zone ID, the registry records the zone before method creation is attempted.

## Method Creation

TASK-008B can add enabled `flat_rate` method instances for these fixed method keys:

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
- Existing method instances are not updated in this task.
- Manual or unknown zones are not touched.

New flat-rate method settings use:

- `title`: method label from the wizard.
- `cost`: selected wilaya price, or method default price as resolved by the preview planner.

Price `0` is valid. Missing, invalid, or negative prices are rejected or skipped safely.

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

The option is written with autoload disabled. The registry does not store dataset rows, secrets, raw preview payloads, or unrelated WooCommerce data.

## Response

The response includes:

- `applyEngineAvailable: true`
- `applied`
- `createdZones`
- `createdMethods`
- `skippedZones`
- `skippedMethods`
- `blockedZones`
- `conflicts`
- `warnings`
- `registryUpdated`
- `wooCommerceChanged`
- `previewHash`
- `applyContractVersion`
- `message`

If no zone or method is created, `applied` is `false` and `wooCommerceChanged` is `false`.

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

TASK-008B does not implement:

- Updating WooCommerce shipping zones.
- Deleting WooCommerce shipping zones.
- Updating existing shipping method labels or prices.
- Deleting shipping methods.
- Adopting manual zones.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
