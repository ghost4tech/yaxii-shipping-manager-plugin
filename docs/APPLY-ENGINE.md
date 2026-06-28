# Safe Apply Engine

## Current Scope

TASK-008A enables the first narrow WooCommerce write path:

- Create missing Yaxii-managed shipping zones from the fresh preview `createZones` group.
- Record each created zone in `yaxii_shipping_manager_managed_zones`.
- Return a clear apply result with created, skipped, blocked, conflict, warning, and registry status fields.

This task does not add shipping methods, update method labels, update prices, update existing zones, delete zones, adopt manual zones, or modify checkout fields.

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

Before creating any zone, the engine:

1. Sanitizes the apply payload.
2. Re-reads WooCommerce diagnostics through the preview planner.
3. Regenerates the preview from `previewRequest`.
4. Compares the fresh `previewHash` with the submitted `previewHash`.
5. Compares the fresh summary with `acceptedPlanSummary`.
6. Blocks if readiness is blocked or conflicts exist.
7. Creates only fresh `createZones` items.

This re-read happens immediately before the WooCommerce write loop.

## Zone Creation

Each created zone uses the previewed `zoneName` and one state location:

```text
DZ:NN
```

The engine appends zones after existing WooCommerce zones by assigning the next zone order. It does not add any shipping method instance in TASK-008A.

## Managed Registry

After WooCommerce returns a created zone ID, the engine records the zone in:

```text
yaxii_shipping_manager_managed_zones
```

Each record includes:

- `wilayaCode`
- `zoneId`
- `zoneName`
- `methodInstances`: empty array
- `createdBy`: `yaxii_shipping_manager`
- `createdAt`
- `updatedAt`
- `source`: `apply_create_missing_zones`
- `schemaVersion`

The option is written with autoload disabled. The registry does not store dataset rows, secrets, raw preview payloads, method prices, or unrelated WooCommerce data.

## Response

The response includes:

- `applyEngineAvailable: true`
- `applied`
- `createdZones`
- `skippedZones`
- `blockedZones`
- `conflicts`
- `warnings`
- `registryUpdated`
- `wooCommerceChanged`
- `previewHash`
- `applyContractVersion`
- `message`

If no zone is created, `applied` is `false` and `wooCommerceChanged` is `false`.

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
- The preview contains only unsupported update or method operations and no creates.
- The current user lacks permission or the REST nonce is invalid.

Manual or unknown zones in `skipManualZones` are not touched.

## Not Implemented

TASK-008A does not implement:

- Updating existing WooCommerce zones.
- Deleting WooCommerce zones.
- Adding WooCommerce shipping methods.
- Updating method labels or prices.
- Adopting manual zones.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
