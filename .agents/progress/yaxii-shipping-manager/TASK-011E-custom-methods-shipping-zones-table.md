# TASK-011E - Custom Methods in Shipping Zones Table

Date: 2026-06-29

## Goal

Fix the Shipping Zones editor so custom shipping methods created by the generator appear in the table after apply.

## Scope

- Frontend display/model mapping for the Shipping Zones table.
- Runtime smoke for the reported custom method case.
- No WooCommerce write logic changes.

## Files changed

- `admin-app/src/components/shipping-zones/ShippingPriceCell.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx`
- `admin-app/src/lib/shipping-zones/pending-changes.ts`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/shipping-zones.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-DRfCUBGN.css`
- `assets/admin/assets/main-Dd1j-NqF.js`
- `docs/RUNTIME-SMOKE.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-011E-custom-methods-shipping-zones-table.md`

## What was before

- The generator/apply flow created `Custom method 1` WooCommerce flat-rate methods.
- Shipping Zones built table methods from persisted plugin settings only.
- Persisted settings still had `custom_1.enabled=false` and `custom_2.enabled=false`.
- The table row model and rendering path were hardcoded around `row.home` and `row.office`.
- Review/repair helpers and bulk tools also assumed only the first two methods.

## What changed

- Shipping Zones now merges live managed method keys from diagnostics into display method definitions.
- `ShippingZoneRowView` now carries `methods[]` while keeping `home` and `office` aliases for compatibility.
- Table rows render method price cells dynamically.
- Expanded details render all managed methods.
- Bulk tools can target all displayed methods or a specific method key.
- Pending review, status review, and repair preview request helpers include all displayed managed methods.
- Missing setup detection now checks required managed method keys, not only home-like and office-like booleans.

## What still remains mocked

- Nothing new was mocked.
- The page still depends on the existing diagnostics payload to discover live managed custom methods.

## Security notes

- No new remote calls.
- No new telemetry or analytics.
- No new REST routes.
- No hidden browser or external asset behavior.

## WooCommerce safety notes

- No WooCommerce write code was changed.
- Existing write paths remain in `SafeApplyEngine`.
- Browser smoke did not trigger generator/apply.
- The fix reads real diagnostics data already exposed to the admin app and changes only presentation/request construction.

## WordPress.org compliance notes

- No external fonts, scripts, or CSS were added.
- No licensing, Pro lock, provider integration, or remote dependency was added.
- Built admin assets were regenerated through the existing Vite build.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `assets/admin`, and `src`
- Raw dataset bundling scan over `assets/admin`
- External asset scan over `admin-app/src`, `src`, and `assets/admin/.vite`
- WooCommerce write scan over `src` and `admin-app/src`
- `git diff --check`
- `git status --short --untracked-files=all`
- Browser smoke with `agent-browser`
- Read-only WP-CLI settings checks

## Check results

- Typecheck passed.
- Lint passed with existing fast-refresh warnings in shared UI files.
- Build passed and emitted `main-Dd1j-NqF.js` and `main-DRfCUBGN.css`.
- Source map count under `assets/admin`: `0`.
- Restricted phrase scan found no hits in production source or built assets.
- Raw dataset bundling scan found no hits in built assets.
- External asset scan found no Google Fonts or remote script/CSS usage; only the existing PHP script tag rewrite helper was matched.
- WooCommerce write scan found existing allowed write code in `SafeApplyEngine`, settings save, and registry save; no new write files were added.
- `git diff --check` passed, with pre-existing CRLF warnings in unrelated dirty files.
- Browser smoke confirmed `Custom method 1 price` inputs render in Shipping Zones.
- Read-only WP-CLI confirmed persisted plugin settings still had custom methods disabled and WooCommerce had 68 `Custom method 1` flat-rate option rows.

## Browser smoke evidence

- Opened `http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager`.
- Authenticated with local admin `dev`.
- Shipping Zones snapshot showed Chlef with:
  - `Home delivery price`: `700`
  - `Office delivery price`: `400`
  - `Custom method 1 price`: `450`
- The same custom method price input appeared for managed rows throughout the table.

## Known risks

- `ShippingZonesPage.tsx`, `ShippingZonesToolbar.tsx`, and `status.ts` remain over 300 lines and should be split in a later refactor.
- The display recovery depends on diagnostics having managed registry data for the live custom methods.
- If a custom method exists in WooCommerce without a managed registry record, it remains protected and should not be adopted automatically.

## Blockers

- None for the reported display bug.

## Next recommended task

Refactor the Shipping Zones table model into smaller method-display helpers and add focused unit coverage for dynamic managed methods.

## Commit hash

Recorded in the final task response after commit.
