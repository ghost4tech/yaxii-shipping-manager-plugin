# Safe Apply Contract

The safe apply contract defines how Yaxii Shipping Manager identifies its own WooCommerce shipping zones without touching manual merchant zones by mistake.

TASK-008B implements the next narrow apply engine step: create missing Yaxii-managed zones and add enabled flat-rate methods with prices to Yaxii-managed zones only from a freshly revalidated preview.

## Managed Zone Registry

Yaxii-created WooCommerce zones are tracked in one WordPress option:

```text
yaxii_shipping_manager_managed_zones
```

The registry is read as a small plugin-owned map. It must not contain dataset rows, raw source data, secrets, or large payloads.

Current record shape supports:

- `wilayaCode`
- `zoneId`
- `zoneName`
- `methodInstances`
- `createdBy`
- `createdAt`
- `updatedAt`
- `source`
- `schemaVersion`

Method instance records support:

- `methodKey`
- `instanceId`
- `methodId`
- `title`
- `lastKnownCost`

If the option is missing or contains invalid records, the registry reader returns an empty or repaired in-memory registry. Zone records are written only after WooCommerce returns a created zone ID. Method instance records are written only after WooCommerce returns a created method instance ID.

## Ownership Priority

Preview ownership is resolved in this order:

1. `managed_registry`: the WooCommerce zone ID exists in the Yaxii managed registry.
2. `yaxii_name_hint`: the zone name looks like it belongs to Yaxii based on the configured prefix/name.
3. `manual_unknown`: the zone is not known to Yaxii and must be protected.

The registry is authoritative. Name hints are weak and must not be treated as proof of ownership by the future apply engine.

## Endpoint

Apply readiness endpoint:

```text
GET /wp-json/yaxii-shipping-manager/v1/apply-contract
```

The endpoint returns:

- `applyEngineAvailable: true`
- `managedRegistryAvailable: true`
- `managedRegistryOption`
- `applyContractVersion`
- `requiredConfirmationText`
- `applyRequestFields`
- `managedZoneCount`
- locked `safetyPolicy`
- `requiredNextSteps`
- `warnings`
- `generatedAt`

Access uses the same protected admin policy as diagnostics and preview:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`

The endpoint does not write to WooCommerce, settings, options, files, or datasets.

## Apply Endpoint

TASK-008B enables a managed-zone-only apply endpoint:

```text
POST /wp-json/yaxii-shipping-manager/v1/apply
```

The endpoint validates the apply request contract, regenerates the preview immediately before writing, creates only missing Yaxii-managed zones from the fresh `createZones` group, and adds enabled flat-rate methods only to managed zones.

```json
{
  "applyEngineAvailable": true,
  "applied": true,
  "createdZones": [],
  "createdMethods": [],
  "skippedZones": [],
  "skippedMethods": [],
  "blockedZones": [],
  "conflicts": [],
  "warnings": [],
  "registryUpdated": true,
  "wooCommerceChanged": true,
  "message": "Added 2 shipping methods to Yaxii-managed zones. Manual zones skipped: 0."
}
```

The endpoint does not update existing zones, update existing method instances, delete zones, delete methods, or touch manual zones.

Access policy:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`
- `X-WP-Nonce` is required

## Apply Request Contract

Apply requests must include:

- `previewHash`: 64-character SHA-256 preview hash from the preview response.
- `previewGeneratedAt`: preview timestamp from the preview response.
- `selectedWilayaCodes`: selected two-digit wilaya codes.
- `acceptedPlanSummary`: numeric summary counts accepted by the merchant.
- `confirmed`: `true`.
- `confirmationText`: `APPLY YAXII SHIPPING PLAN`.
- `safetyPolicySnapshot`: all locked safety policy values set to `true`.
- `applyContractVersion`: `apply-contract-v1`.
- `previewRequest`: sanitized preview request snapshot.

Unknown request keys are rejected. Missing confirmation, stale preview metadata, invalid preview hash format, planned deletes, disabled safety rules, and mismatched preview request wilayas are rejected.

The apply engine re-reads WooCommerce and regenerates the preview before writing. A submitted preview hash is a contract reference, not proof that current WooCommerce state is unchanged.

The generator UI may show a checkbox confirmation for the current safe apply scope. That checkbox does not weaken the backend contract: the frontend still sends `confirmed: true` and the required confirmation phrase internally only after the merchant checks the box. Typed confirmation should be reserved in the UI for future dangerous actions such as deletes, manual-zone adoption, or overwrites.

## Safety Rules

The MVP safety policy remains locked on:

- Protect manual WooCommerce zones.
- Require preview before apply.
- Skip conflicts by default.
- Never delete manual zones.

Manual zones are protected by default even when they overlap Algeria wilayas.

## Apply Readiness UX

The preview response includes `applyReadiness`, a read-only display model that explains the current workflow state before the real apply engine exists.

Readiness states are documented in:

```text
docs/APPLY-WORKFLOW.md
```

The readiness model does not replace the apply contract. TASK-008B still requires explicit confirmation and fresh preview revalidation before creating zones or methods.

## Apply Engine Rules

The TASK-008B apply engine must:

- Apply only explicitly reviewed preview plans.
- Write only missing zones that are about to be recorded in the managed registry.
- Add methods only to zones already recorded in the managed registry or created and recorded in the same apply request.
- Never overwrite manual/unknown zones by default.
- Never delete zones in the MVP.
- Re-read WooCommerce state immediately before applying.
- Report every create, method add, skip, conflict, unsupported update item, and failure.
- Leave existing zone and method updates for a later task.

## Not Implemented Yet

TASK-008B does not:

- Update WooCommerce shipping zones.
- Delete WooCommerce shipping zones.
- Update existing shipping method labels or prices.
- Delete shipping methods.
- Persist preview plans.
