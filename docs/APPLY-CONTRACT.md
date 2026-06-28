# Safe Apply Contract

The safe apply contract defines how Yaxii Shipping Manager will later identify and update its own WooCommerce shipping zones without touching manual merchant zones by mistake.

This contract is foundation-only. The apply engine is not implemented yet.

## Managed Zone Registry

Future Yaxii-created WooCommerce zones will be tracked in one WordPress option:

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

If the option is missing or contains invalid records, the registry reader returns an empty or repaired in-memory registry. TASK-005A does not persist repaired records.

## Ownership Priority

Preview ownership is resolved in this order:

1. `managed_registry`: the WooCommerce zone ID exists in the Yaxii managed registry.
2. `yaxii_name_hint`: the zone name looks like it belongs to Yaxii based on the configured prefix/name.
3. `manual_unknown`: the zone is not known to Yaxii and must be protected.

The registry is authoritative. Name hints are weak and must not be treated as proof of ownership by the future apply engine.

## Endpoint

Read-only apply readiness endpoint:

```text
GET /wp-json/yaxii-shipping-manager/v1/apply-contract
```

The endpoint returns:

- `applyEngineAvailable: false`
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

## Disabled Apply Endpoint

TASK-006A adds a disabled apply endpoint:

```text
POST /wp-json/yaxii-shipping-manager/v1/apply
```

The endpoint validates the future apply request contract, then returns:

```json
{
  "applyEngineAvailable": false,
  "message": "Apply engine is not enabled yet.",
  "requestAccepted": true
}
```

The endpoint is intentionally disabled and does not write to WooCommerce.

Access policy:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`
- `X-WP-Nonce` is required

## Future Apply Request Contract

Future apply requests must include:

- `previewHash`: 64-character SHA-256 preview hash from the preview response.
- `previewGeneratedAt`: preview timestamp from the preview response.
- `selectedWilayaCodes`: selected two-digit wilaya codes.
- `acceptedPlanSummary`: numeric summary counts accepted by the merchant.
- `confirmed`: `true`.
- `confirmationText`: `APPLY YAXII SHIPPING PLAN`.
- `safetyPolicySnapshot`: all locked safety policy values set to `true`.
- `applyContractVersion`: `apply-contract-v1`.

Unknown request keys are rejected. Missing confirmation, stale preview metadata, invalid preview hash format, planned deletes, and disabled safety rules are rejected.

The future real apply engine must re-read WooCommerce and regenerate/compare the preview before writing. A submitted preview hash is a contract reference, not proof that current WooCommerce state is unchanged.

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

The readiness model does not change the apply contract. The apply engine still reports unavailable until a future task implements and audits WooCommerce writes.

## Future Apply Engine Requirements

The future apply engine must:

- Apply only explicitly reviewed preview plans.
- Write only zones/methods that are recorded in, or about to be recorded in, the managed registry.
- Never overwrite manual/unknown zones by default.
- Never delete zones in the MVP.
- Re-read WooCommerce state immediately before applying.
- Report every create, update, skip, conflict, and failure.

## Not Implemented Yet

TASK-005A does not:

- Create WooCommerce shipping zones.
- Update WooCommerce shipping zones.
- Delete WooCommerce shipping zones.
- Add shipping methods.
- Update method prices.
- Persist preview plans.
- Implement the apply engine.
