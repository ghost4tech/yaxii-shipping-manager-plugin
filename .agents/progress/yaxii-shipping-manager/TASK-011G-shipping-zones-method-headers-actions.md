# TASK-011G - Shipping Zones Method Headers and Row Actions

Date: 2026-06-30

## Goal

Polish the Shipping Zones table so each method has its own header label and protected/manual row actions are compact and correctly ordered.

## Scope

- Shipping Zones table header labels.
- Protected/manual row contextual action placement and copy.
- Built admin asset refresh.
- No backend or WooCommerce write behavior changes.

## Files changed

- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CmRHNzhm.css`
- `assets/admin/assets/main-o4Wcro8u.js`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-011G-shipping-zones-method-headers-actions.md`

## What was before

- The desktop table header showed one generic `Methods` label over all method price columns.
- The protected/manual row action used `Check diagnostics`.
- The diagnostics action appeared after the enable switch and could wrap awkwardly in the action column.

## What changed

- The table header now renders the visible method labels from the row model, such as `Home delivery`, `Office delivery`, and `Custom method 1`.
- The generic `Methods` header was removed.
- The protected/manual contextual action is now a one-word `Diagnostics` button.
- Contextual actions now render before the row enable switch.
- Row action buttons use nowrap styling and a wider desktop action column.

## What remains mocked

Nothing new.

## Security review

- No new routes.
- No new API calls.
- No telemetry, analytics, or remote behavior.

## WooCommerce safety review

- No WooCommerce PHP files changed.
- No preview/apply behavior changed.
- Browser smoke did not trigger generator or apply actions.

## WordPress.org compliance review

- No external font, CSS, script, or remote dependency was added.
- Built admin assets were regenerated through the existing Vite build.

## Checks run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser smoke with `agent-browser`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `assets/admin`, and `src`
- External asset scan over source/manifest files
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Typecheck passed.
- Lint passed with existing fast-refresh warnings in shared UI files.
- Build passed and emitted `main-o4Wcro8u.js` and `main-CmRHNzhm.css`.
- Browser smoke confirmed the header context includes `Wilaya`, `Status`, `Home delivery`, `Office delivery`, `Custom method 1`, and `Active`.
- Browser smoke confirmed the generic `Methods` header is gone.
- Browser smoke confirmed `Check diagnostics` is gone and the protected row shows `Diagnostics` before the switch.
- Source map count: `0`.
- Restricted phrase scan found no production source or built asset hits.
- External asset scan found no remote-loaded source or manifest assets.

## Risks

- Header labels are derived from the first visible row; if future filters ever show rows with different displayed method sets, the table model should provide method headers explicitly.
- `ShippingZoneRow.tsx` and `ShippingZonesTable.tsx` remain table-specific UI files and should be split if more behavior is added.

## Blockers

None.

## Next task

Extract Shipping Zones table layout/header helpers before additional row controls are added.

## Commit hash

Recorded in the final task response after commit.
