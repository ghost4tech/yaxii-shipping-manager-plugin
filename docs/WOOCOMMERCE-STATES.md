# WooCommerce Algeria States

## What This Does

Yaxii Shipping Manager registers Algeria wilayas from the normalized current dataset into WooCommerce's state list.

This lets WooCommerce recognize Algeria wilaya codes as selectable regions/states before later diagnostics, preview planning, and safe shipping-zone generation are implemented.

## Why WooCommerce States Are Needed

WooCommerce shipping zones match customer addresses by country and state/region codes. If Algeria wilayas are not present in WooCommerce's state list, later zone diagnostics and generation cannot rely on stable wilaya codes.

TASK-003C only registers those state codes in WooCommerce's in-memory state list through the `woocommerce_states` filter.

## Dataset Used

Only the normalized current dataset is used:

```text
data/algeria/current/wilayas.json
```

Raw source files under `data/sources/` are not read at runtime.

Legacy 58-compatible mode remains unavailable until an auditable mapping exists.

## State Code Format

WooCommerce country code:

```text
DZ
```

State keys use normalized two-digit wilaya codes:

```text
01
16
31
```

The code format matches `data/algeria/current/wilayas.json`.

## Label Format

State labels use the persisted `regionLabelFormat` setting when possible:

- `fr`: French
- `ar`: Arabic
- `fr_ar`: French - Arabic
- `ar_fr`: Arabic - French

If settings are not available, labels fall back to French.

## What Is Not Registered

Communes and cities are not registered as WooCommerce states.

Commune data remains reference/mapping data for later tasks and does not create commune-level pricing in the MVP.

## What This Does Not Do

TASK-003C does not:

- Create WooCommerce shipping zones.
- Update WooCommerce shipping zones.
- Delete WooCommerce shipping zones.
- Add or update WooCommerce shipping methods.
- Implement WooCommerce diagnostics.
- Implement the preview planner.
- Implement the safe apply engine.
- Modify checkout city or commune fields.

Future shipping-zone generation must still come after read-only diagnostics and a preview planner.
