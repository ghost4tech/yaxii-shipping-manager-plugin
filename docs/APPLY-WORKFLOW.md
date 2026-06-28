# Apply Workflow UX States

The apply workflow state model explains whether the current preview can be applied safely.

TASK-008B allows two narrow write paths: create missing Yaxii-managed zones from the preview `createZones` group, and add enabled flat-rate methods with prices to managed zones. The readiness model is still informational; the apply endpoint revalidates the preview before any write.

## Source Inputs

The readiness model is evaluated from:

- the read-only preview plan
- diagnostics summary
- safe apply contract
- locked settings safety policy

The model is returned inside:

```text
POST /wp-json/yaxii-shipping-manager/v1/preview
```

Response field:

```json
{
  "applyReadiness": {
    "state": "fresh_store",
    "severity": "ready",
    "title": "Ready to create Yaxii shipping zones",
    "message": "No existing Algeria wilaya zones were found. Apply can create reviewed Yaxii-managed zones.",
    "recommendedAction": "Review the plan before applying.",
    "blockingReasons": [],
    "counts": {
      "creates": 69,
      "updates": 0,
      "manualSkips": 0,
      "conflicts": 0,
      "methodAdditions": 0,
      "methodUpdates": 0
    }
  }
}
```

## States

### `fresh_store`

No direct Algeria wilaya zones exist and the preview mostly creates zones.

UX title:

```text
Ready to create Yaxii shipping zones
```

### `partial_setup`

Some wilayas already have WooCommerce zones and others are missing.

UX title:

```text
Some wilayas are ready; missing wilayas can be created later
```

### `manual_zones_detected`

Manual or unknown zones overlap selected wilayas.

UX title:

```text
Manual zones are protected and will be skipped
```

### `conflicts_detected`

Duplicate direct zones or unsafe conflicts exist.

UX title:

```text
Resolve conflicts before applying
```

### `methods_missing`

Matching zones exist but required enabled methods are missing or need updates.

UX title:

```text
Missing methods can be added to managed zones
```

### `yaxii_managed_ready`

Managed registry zones exist, or the preview can update Yaxii-looking zones after review.

UX title:

```text
Yaxii-managed zones are already present
```

### `blocked`

WooCommerce is inactive, no wilayas are selected, or another critical condition prevents a useful apply review.

UX title:

```text
Cannot apply yet
```

## Severity

- `ready`: the preview can be reviewed for apply.
- `attention`: the preview needs merchant review because setup is partial, manual zones are protected, or methods need work.
- `blocked`: conflicts or critical missing conditions prevent apply.

The current plugin returns:

```json
{
  "previewHash": "64-character sha256 hash",
  "previewGeneratedAt": "2026-06-28T00:00:00+00:00",
  "applyContractVersion": "apply-contract-v1",
  "canApplyLater": true,
  "canApplyLaterMessage": "Apply can create missing Yaxii-managed zones and add missing methods with prices to managed zones."
}
```

`canApplyLater` is true only when the preview has missing zones or missing methods to create and no blocking conflicts. The preview hash is a reference for a confirmed apply request. It is not stored and does not allow apply by itself.

## Counts

Readiness counts are derived from preview groups:

- `creates`
- `updates`
- `manualSkips`
- `conflicts`
- `methodAdditions`
- `methodUpdates`

These counts are explanatory only. They do not persist a preview plan.

## Safety Boundary

The readiness model does not:

- update WooCommerce shipping zones
- delete WooCommerce shipping zones
- update existing shipping methods
- persist a preview plan

Zone creation, method creation, and registry writes happen only inside `POST /apply` after explicit confirmation and fresh preview revalidation.

## Final Step UX

The generator final step auto-runs preview once when the merchant reaches the step with a valid draft. The main view shows a short merchant summary:

- wilayas selected
- zones to create
- methods to add
- updates reserved for a later step
- manual zones skipped
- conflicts
- enabled methods and price summary

Large method lists, zone IDs, method keys, preview hash, contract version, generated timestamp, raw preview groups, and registry/ownership labels stay collapsed under `View affected wilayas` or `Advanced details`.

For the current safe apply scope, the visible confirmation is a checkbox. The frontend submits the backend-required confirmation phrase internally only after the checkbox is checked. Typed confirmation remains a backend contract field and should be reserved in the UI for future dangerous actions such as deletes, manual-zone adoption, or overwrites.

TASK-008B keeps manual zones protected, skips manual overlaps, and blocks conflicts.
