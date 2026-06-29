# Diagnostics Reference Integration Plan

Date: 2026-06-29

## Goal

Replace the current noisy Diagnostics page with a merchant-friendly health-check UI based on the latest prototype reference, while keeping diagnostics read-only and driven by the real backend contract.

Reference source:

```text
.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx
```

Production source today:

```text
admin-app/src/routes/index.tsx
admin-app/src/api/diagnostics-api.ts
admin-app/src/types/diagnostics.ts
```

## Current Contract

The frontend already has a real diagnostics client:

```text
GET /wp-json/yaxii-shipping-manager/v1/diagnostics
```

The response provides:

- `woocommerceActive`
- `summary.totalWilayas`
- `summary.configuredWilayas`
- `summary.missingWilayas`
- `summary.duplicateConflictCount`
- `summary.zonesWithoutMethods`
- `summary.checkoutFallbackRisk`
- `summary.recommendedNextAction`
- `summary.restOfWorldHasMethods`
- `wilayaResults`
- `zoneResults`
- `warnings`
- `generatedAt`

No new backend endpoint is required for the first UI integration.

## Desired Page Shape

The new Diagnostics page should read as a health check:

1. Header with `Refresh diagnostics`.
2. Overall health summary.
3. Passed / warnings / failures counts.
4. Health cards:
   - WooCommerce status
   - Algeria shipping setup
   - Missing setup
   - Conflicts
   - Manual/protected zones
   - Method issues
   - Checkout fallback risk
   - Rest-of-world shipping
5. Recommended next action.
6. Collapsed advanced details for support.

## Health Card Mapping

| Card | Data source | Status logic |
| --- | --- | --- |
| WooCommerce detected | `woocommerceActive` | `ok` when true, `fail` when false. |
| Algeria setup coverage | `configuredWilayas`, `totalWilayas` | `ok` when all configured, `warn` when partial, `fail` only if zero with WooCommerce active. |
| Missing setup | `missingWilayas` | `ok` when 0, `warn` when greater than 0. |
| Conflicts | `duplicateConflictCount` | `ok` when 0, `fail` when greater than 0. |
| Manual/protected zones | `zoneResults` where `ownershipHint === "manual_unknown"` and overlaps/matches selected Algeria states | `ok` when 0, `warn` when present. |
| Method issues | `zonesWithoutMethods`, disabled methods, missing home/office-like methods | `ok` when none, `warn` when present. |
| Checkout fallback risk | `checkoutFallbackRisk` | `ok` for low, `warn` for medium, `fail` for high. |
| Rest-of-world methods | `restOfWorldHasMethods` | `ok` when true, `warn` when false. |

The first implementation can compute manual/protected and method issues from `zoneResults` in a frontend helper. If the helper becomes complex, a later backend task can add a dedicated display model.

## Recommended Components

Create:

```text
admin-app/src/components/diagnostics/DiagnosticsPage.tsx
admin-app/src/components/diagnostics/DiagnosticsHealthSummary.tsx
admin-app/src/components/diagnostics/DiagnosticsIssueList.tsx
admin-app/src/components/diagnostics/DiagnosticsRecommendationCard.tsx
admin-app/src/components/diagnostics/DiagnosticsWilayaCoverage.tsx
admin-app/src/components/diagnostics/DiagnosticsAdvancedDetails.tsx
admin-app/src/lib/diagnostics/status.ts
```

Adjust names if implementation finds better local conventions.

`admin-app/src/routes/index.tsx` should only pass:

- bootstrap payload
- diagnostics load state
- wilayas if still needed for selectors
- refresh callback
- navigation callbacks

## Main View Rules

Keep in the main merchant view:

- simple status labels
- counts
- recommended next action
- buttons to open Generator, Shipping Zones, WooCommerce zones, or refresh

Do not show in the main merchant view:

- full wilaya list
- full zone list
- zone IDs
- method instance IDs
- raw ownership source labels
- raw warnings beyond the first important warning
- generated timestamp

## Advanced Details

`DiagnosticsAdvancedDetails` should collapse:

- full wilaya coverage table
- existing WooCommerce zone list
- raw warnings
- generated timestamp
- ownership and method details

This keeps agency/support data available without making Diagnostics the daily management workflow.

## Copy From Reference

Can copy/adapt:

- Idle/empty health-check visual idea.
- Running/loading visual idea.
- Passed/warnings/failures summary.
- Health card layout.
- Compact result cards with icon, label, and detail.

Must adapt:

- `Run check` should call existing refresh/load behavior.
- Health cards must be derived from `DiagnosticsResponse`.
- "verify every Algeria wilaya can complete checkout" should be softened because current diagnostics are read-only and not a full checkout-rate proof.

Must remove:

- `setTimeout` mock check.
- Mock `CheckResult` generation.
- Mock `WooCommerce 8.x active` text.
- Mock checkout simulator as proof.
- Any claim that disabled frontend wilayas equal missing WooCommerce setup.

## WordPress.org and WooCommerce Safety

This UI task must not add:

- WooCommerce writes
- new REST routes
- telemetry
- remote assets
- Lovable runtime
- provider APIs
- YSF sync
- reset/wipe tooling

Diagnostics remains read-only. Any write-looking next action must route to Generator or Shipping Zones, where preview/apply safety is already enforced.

## Implementation Checks

Recommended checks for the implementation task:

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- external asset scan
- restricted phrase scan
- `git diff --check`
- browser smoke of Diagnostics in wp-admin if frontend code changes

No PHP checks are needed unless backend files change.
