# TASK-010G - Enable/Disable Yaxii-Managed Methods

Date: 2026-06-29

## Goal

Add safe enable/disable support for Yaxii-managed shipping methods from the Shipping Zones page and remove the unused 3-dot row action menu.

## Scope

- Add explicit preview/apply support for registry-owned managed method status changes.
- Wire Shipping Zones method-level, row-level, and bulk selected enable/disable controls.
- Keep all WooCommerce writes inside `SafeApplyEngine`.
- Protect manual/unknown zones and methods.
- Keep missing setup on the repair flow.
- Remove the Shipping Zones 3-dot row actions.

## Git state

- Branch: `task/010g-enable-disable-managed-methods`
- Base: `76c340c` / `TASK-010F: add missing setup repair flow`
- Local `main` and `origin/main` contained TASK-010F before this branch was created.
- Commit hash: pending at report creation; final hash reported in task closeout.

## Files changed

- `admin-app/src/api/preview-api.ts`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/components/shipping-zones/ReviewChangesDialog.tsx`
- `admin-app/src/components/shipping-zones/ShippingPriceCell.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx`
- `admin-app/src/lib/shipping-zones/pending-changes.ts`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/apply.ts`
- `admin-app/src/types/preview.ts`
- `admin-app/src/types/shipping-zones.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CWYIE_GA.css`
- `assets/admin/assets/main-CYa6dRL1.js`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `src/Apply/ApplyContract.php`
- `src/Apply/ApplyReadinessEvaluator.php`
- `src/Apply/ApplyRequestSanitizer.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `src/Preview/PreviewRequestSanitizer.php`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-010G-enable-disable-managed-methods.md`

Build output replaced:

- Removed old built assets:
  - `assets/admin/assets/main-BVeMQvlL.css`
  - `assets/admin/assets/main-CEvBPosO.js`
- Added current built assets:
  - `assets/admin/assets/main-CWYIE_GA.css`
  - `assets/admin/assets/main-CYa6dRL1.js`

## What was before

- Shipping Zones showed enable/disable as a future or visual state only.
- The 3-dot row action menu contained little useful functionality.
- Preview/apply could create managed zones, add methods, repair missing setup, and update managed method labels/prices, but it could not update method enabled status.

## What changed

- Added `updateMethodStatuses` as an explicit preview plan group and accepted summary count.
- Added `method_status_update` preview items for registry-owned `flat_rate` method instances.
- Apply revalidates status changes through the existing preview/apply contract before writing.
- `SafeApplyEngine` verifies:
  - managed registry ownership
  - matching wilaya code
  - existing WooCommerce zone
  - expected `DZ:NN` zone location
  - recorded method key
  - recorded instance ID
  - `flat_rate` method type
- Status writes update only WooCommerce's zone-method `is_enabled` flag for the verified `zone_id`, `instance_id`, and `flat_rate` method row.
- Registry method records now store `enabled`.
- Shipping Zones method cells show active status switches for supported managed methods.
- Row-level wilaya switch creates pending status changes for all existing managed methods in that row.
- Selected-row toolbar now has active `Enable` and `Disable` quick tools for selected editable managed rows.
- Review dialog shows mixed price/status changes, including `Enabled -> Disabled` and `Disabled -> Enabled`.
- The 3-dot row action menu was removed.

## Backend behavior

- Disable one method: disables only the selected registry-owned WooCommerce method instance.
- Enable one method: enables only the selected existing registry-owned WooCommerce method instance.
- Disable wilaya: disables existing Yaxii-managed methods in that wilaya; it does not delete or disable the WooCommerce zone.
- Enable wilaya: enables existing Yaxii-managed methods; missing setup remains on the repair flow.
- Mixed price and status batches are supported when preview/apply remains safe.

## Preview behavior

- `PreviewRequestSanitizer` accepts per-row `methodStatuses`.
- `PreviewPlanner` includes disabled flat-rate method templates so existing disabled methods can be re-enabled.
- Missing disabled methods are not created by enable/disable controls.
- Status-only differences produce `updateMethodStatuses`, not `updateMethods`.
- `canApplyLater` includes status updates when there are no blocking conflicts.

## Apply behavior

- Apply regenerates the preview before writing and compares hash/summary as before.
- Status changes are applied after price/label updates.
- Status writes are skipped and reported if any ownership, zone, location, method, or type check fails.
- Manual/unknown methods and zones are not updated.
- No WooCommerce zones or methods are deleted.

## Frontend UX behavior

- Method cells show a compact enabled switch when the method is registry-owned and safe to toggle.
- Disabled methods remain visible with muted price state.
- Pending status changes show old status to new status.
- Row-level switch toggles both existing managed method statuses.
- Bulk toolbar supports Enable and Disable for selected managed rows.
- Missing setup rows keep repair behavior and do not expose enable/disable writes.
- Protected/manual/conflict rows stay locked and route to diagnostics.

## Removed 3-dot row actions

The row menu and `MoreHorizontal` dropdown were removed. Remaining row actions are direct and contextual:

- row enabled switch
- repair setup when missing setup is repairable
- check diagnostics for protected/conflict rows
- open generator for unsupported missing setup states
- discard pending changes when present

## What still remains mocked

Nothing new was mocked for this task.

## What remains not implemented

- Zone-name updates.
- Deletes/reset/wipe tooling.
- Manual-zone adoption.
- Manual or unknown method updates.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.

## Security notes

- No new REST route was added.
- Existing nonce and capability-protected preview/apply routes are still used.
- The frontend does not write directly to WooCommerce.
- No telemetry, licensing, Pro locks, external assets, or remote calls were added.

## WooCommerce safety notes

- The only new WooCommerce write is in `SafeApplyEngine`.
- Method status writes are limited to registry-owned `flat_rate` method instances after fresh preview revalidation.
- The write targets only WooCommerce's zone-method `is_enabled` flag for a verified zone ID, method instance ID, and method ID.
- No WooCommerce zones or methods are deleted.
- Manual/unknown zones and methods remain protected.

## WordPress.org compliance notes

- No external CDN assets, Google Fonts, remote scripts, or remote CSS were added.
- No hidden tracking, telemetry, licensing, or upsell behavior was added.
- Built assets are local.
- Reference app files were not staged.

## Runtime smoke result

WP-CLI/REST smoke passed on LocalWP:

```text
before zone=73 flat_rates=2 home=enabled:700 office=enabled:400
baseline preview updateMethods=0 updateMethodStatuses=0 applyChanged=no
disable office preview updateMethods=0 updateMethodStatuses=1 applyUpdated=1
enable office preview updateMethods=0 updateMethodStatuses=1 applyUpdated=1
disable wilaya preview updateMethods=0 updateMethodStatuses=2 applyUpdated=2
restore preview updateMethods=0 updateMethodStatuses=2 applyUpdated=2
after zone=73 flat_rates=2 home=enabled:700 office=enabled:400
Success: TASK-010G status smoke passed; DZ:01 restored with no duplicate managed methods.
```

Verified:

- DZ:01 Office disable removes Office delivery from enabled rate output while Home remains available.
- DZ:01 Office re-enable restores Office delivery at `400`.
- DZ:01 wilaya disable removes both Home and Office from enabled rate output without deleting methods.
- DZ:01 wilaya restore returns Home `700` and Office `400`.
- Managed flat-rate method count stayed `2`.

## Browser smoke result

Authenticated browser smoke passed using a temporary administrator user that was deleted afterward.

Verified:

- Shipping Zones page renders in `wp-admin`.
- Method-level Home/Office switches are visible.
- Row-level wilaya switch is visible.
- DZ:01 shows Home `700` and Office `400`.
- 3-dot row action menu is absent.
- Selecting Adrar shows selected-row quick tools including `Enable` and `Disable`.
- Bulk `Disable` creates pending status changes without immediate WooCommerce writes.
- Pending status changes show two pending changes and `Save changes`/`Review` controls.
- Pending browser changes can be discarded back to `Pending changes 0`.

Browser note:

- Pointer activation of the row checkbox was flaky in `agent-browser`; keyboard activation selected the row successfully. This matches prior toolbar-smoke behavior and did not block the UI verification.

## QA guard findings

- `clean-code-guard`: status support is scoped to existing preview/apply helpers and does not add a parallel write path.
- `docs-guard`: docs were updated to reflect real method-status behavior and the WooCommerce zone-method enabled flag.
- `woo-guard`: status writes remain in `SafeApplyEngine`, revalidate ownership, and do not delete zones or methods.
- `wp-guard`: no new route was added; existing REST nonce/capability rules remain in place.
- `wp-rest-api`: preview/apply response contracts were updated consistently for `updateMethodStatuses`.
- `wp-plugin-directory-guidelines`: no remote assets, telemetry, licensing, or external service behavior was added.

## Checks run

- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan over production source/assets
- raw dataset marker scan over built JS/CSS
- external asset scan for Google Fonts, remote CSS, and remote scripts
- WooCommerce write scan
- WP-CLI/REST runtime smoke
- authenticated browser smoke
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Composer autoload: passed.
- PHP syntax: passed.
- TypeScript typecheck: passed.
- Lint: passed with existing Fast Refresh warnings in shared UI files.
- Build: passed.
- Source maps: none found under `assets/admin`.
- Restricted phrase scan: no hits in production source/assets.
- Raw dataset marker scan: no hits in built JS/CSS.
- External asset scan: no Google Fonts, remote CSS, or remote scripts.
- WooCommerce write scan: status write is limited to `SafeApplyEngine`; no delete path or manual update path was added.
- Runtime smoke: passed.
- Browser smoke: passed with keyboard activation for row selection.
- `git diff --check`: passed.
- `git status`: only task files and rebuilt admin assets changed; no reference app files staged.

## Known risks

- WooCommerce stores shipping-zone method enabled state in `woocommerce_shipping_zone_methods.is_enabled`; the implementation uses the same narrow table field WooCommerce admin uses because `WC_Shipping_Zone` does not expose a public status setter in this installed WooCommerce version.
- The generator preview panel now recognizes method status updates, but this task did not redesign Generator UX for status-only batches.
- Browser automation can be flaky with pointer clicks on the custom checkbox; keyboard activation worked.

## Blockers

None.

## Next recommended task

TASK-010H: focused UI/browser polish for method status review copy and disabled-method visual states after merchant testing.
