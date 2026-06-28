# WooCommerce Diagnostics

Yaxii Shipping Manager diagnostics are read-only checks for existing WooCommerce shipping configuration.

## What Diagnostics Read

- WooCommerce shipping zones.
- Zone IDs, names, and locations.
- Shipping methods attached to each zone.
- Method instance IDs, method type IDs, titles, enabled state, and flat-rate cost strings when WooCommerce exposes them safely.
- Yaxii managed registry ownership for existing zone IDs, including recorded method keys and instance IDs.
- The normalized current Algeria wilaya dataset.
- Persisted Yaxii settings needed for weak Yaxii-name hints, such as the zone prefix.

## What Diagnostics Do Not Write

Diagnostics do not create, update, or delete WooCommerce shipping zones.

Diagnostics do not add shipping methods, change method prices, alter checkout fields, persist preview plans, or apply any store configuration. They are a read-only input for preview and safe apply revalidation.

## Coverage Rules

The current diagnostics compare WooCommerce zone locations with Yaxii current wilaya codes under `DZ`.

- A zone location like `DZ:01` is treated as a direct match for wilaya code `01`.
- A country-level `DZ` zone is treated as overlapping Algeria wilayas, but it does not count as a direct configured wilaya zone.
- More than one direct zone match for the same wilaya is reported as a conflict.
- Zones with no enabled methods are reported as method gaps.

Manual merchant zones are not treated as bad by default. Registry ownership is authoritative for Yaxii-managed zones. Yaxii-looking names are only weak hints based on the configured prefix or the `Yaxii` name.

## Risk Levels

- `low`: Wilayas are directly configured, no duplicate conflicts were found, and matching zones have enabled methods.
- `medium`: Some wilayas are missing, duplicate/conflict conditions exist, or matched zones have no enabled methods.
- `high`: WooCommerce is inactive, or no wilayas are directly configured and no enabled rest-of-world fallback method is visible.

Diagnostics do not prove checkout is fully safe. They only report what the read layer can inspect.

## Why Preview And Apply Are Separate

Shipping zones are store configuration. Yaxii creates missing managed zones and adds methods to managed zones only after a separate preview planner shows proposed creates, method additions, skips, and conflicts, and the apply endpoint regenerates that preview immediately before writing.
