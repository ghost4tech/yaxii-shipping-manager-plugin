# TASK-010F: Missing Setup Repair UX for Shipping Zones

Date: 2026-06-29

## Goal

Add a clear repair flow on the Shipping Zones page for wilayas whose Yaxii-managed WooCommerce setup is missing or incomplete, while continuing to use the existing preview/apply safety path.

## Scope

Implemented frontend UX for single-row and selected-row missing setup repair. No new backend write path was added. The existing REST preview/apply flow and `SafeApplyEngine` remain the only WooCommerce write path.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/010f-missing-setup-repair-ux`
- Base before task: `fd690fb` (`TASK-010E: align shipping zones quick tools with reference`)
- Local `main` and `origin/main` were fast-forwarded to `fd690fb` before branching.
- `.agent/skills/` was not present; `.agents/skills/` was present and used.

## Files changed

- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/shipping-zones.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BVeMQvlL.css`
- `assets/admin/assets/main-CEvBPosO.js`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`

## Files created

- `admin-app/src/components/shipping-zones/RepairSetupDialog.tsx`
- `.agents/progress/yaxii-shipping-manager/TASK-010F-missing-setup-repair-ux.md`

## What was before

The Shipping Zones table correctly showed Alger and Djelfa as `Missing setup` after their WooCommerce zones were manually deleted, but the page did not provide a clear repair action. Missing rows were accurate but not actionable enough for a merchant.

## What changed

Missing setup rows now expose a clear `Repair setup` action. Selected missing setup rows expose `Repair selected` in the selected-row toolbar. Price inputs remain disabled for missing rows, so repair is not confused with normal price editing.

## Missing setup behavior

A row is treated as repairable when the diagnostics-derived live zone state is `missing`, meaning the direct Yaxii-managed setup is absent or incomplete. The row stays locked for price editing, shows `Missing setup`, and the details copy explains that the wilaya is missing its Yaxii-managed WooCommerce setup.

## Single-row repair behavior

The row-level `Repair setup` action opens a compact repair dialog. The dialog builds a preview request for that wilaya only, using the existing method defaults from the current settings-derived method definitions. If the preview is safe and contains supported setup work, the existing apply endpoint is called with the normal confirmation contract.

## Multi-row repair behavior

When selected rows include missing setup rows, the selected-row toolbar shows `Repair selected`. It sends only the selected repairable missing rows into the same repair dialog and preview/apply path. Active price rows keep the normal quick tools. Protected/manual rows are counted as skipped and do not receive repair or price changes.

## Conflict safety behavior

Manual/protected rows remain non-repairable and route to Diagnostics. The repair dialog also rejects blocked previews, conflicts, or previews without supported create/add-method work, and offers `Check diagnostics` instead of applying.

## Review/apply behavior

Repair uses:

- `fetchPreview`
- `fetchApply`
- `APPLY YAXII SHIPPING PLAN`
- current preview/apply contract versions
- diagnostics refresh after successful apply

No direct WooCommerce write was added in React.

## Browser smoke result

Authenticated browser smoke was run through the local WordPress admin page. The Shipping Zones page rendered after login and showed Alger and Djelfa as active after repair, with live prices Home `700` and Office `400`. Because the REST repair smoke repaired the two missing rows first, the browser pass did not re-open a missing-row state afterward.

Temporary smoke admin user `ysm_smoke_010f` was created for the browser session and deleted afterward.

## Runtime smoke result

WP-CLI/REST smoke repaired the user's current missing setup case:

```text
before 16 status=missing
before 17 status=missing
preview createZones=2 addMethods=0 updateMethods=0 conflicts=0
apply createdZones=2 createdMethods=4 updatedMethods=0 conflicts=0 changed=yes
after 16 status=configured zoneId=71 home=700 office=400
after 17 status=configured zoneId=72 home=700 office=400
PASS repaired 2 wilaya(s); manual zones were not touched by apply
```

## What still remains mocked

Nothing new was mocked for this task. Existing future areas remain future only: enable/disable method writes, CSV backend, commune-level pricing, provider imports, and YSF sync.

## What remains not implemented

- Enable/disable method writes.
- Zone-name updates from the Shipping Zones table.
- Manual-zone adoption.
- Deletes/reset tooling.
- CSV import/export backend.
- Commune-level pricing.
- Provider import/sync workflows.

## Security notes

State-changing repair still goes through authenticated REST preview/apply with the existing nonce/capability behavior. No new route or direct browser-to-WooCommerce write path was added.

## WooCommerce safety notes

The only WooCommerce setup writes remain in `src/Apply/SafeApplyEngine.php`. Runtime smoke confirmed missing managed zones for Alger and Djelfa were recreated and manual zones were not touched. No duplicate-method behavior was observed in the repair result.

## WordPress.org compliance notes

No telemetry, remote calls, external fonts, licensing, Pro locks, or CDN assets were added. Reference app files were not staged or committed.

## QA guard findings

- `clean-code-guard`: repair logic is scoped to small components/helpers; no broad route growth or mock runtime introduced.
- `docs-guard`: updated docs describe actual implemented behavior and mark unsupported actions as future.
- `woo-guard`: no new WooCommerce write surface; existing safe apply engine remains the write boundary.
- `wp-guard`: no new WordPress REST route or PHP state-changing handler added.
- `wp-rest-api`: existing preview/apply clients are reused; no API contract expansion.
- `wp-plugin-directory-guidelines`: no external assets, tracking, licensing, obfuscation, or misleading paid screen added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan over production source, built assets, and changed docs
- raw dataset marker scan over built JS
- external font/remote asset scan
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`
- WP-CLI/REST missing setup repair smoke
- authenticated browser smoke

## Check results

- Typecheck: passed.
- Lint: passed with existing Fast Refresh warnings in shared UI files and `main.tsx`.
- Build: passed with existing Vite tsconfig-paths and chunk-size warnings.
- Source maps: none found under `assets/admin`.
- Restricted phrase scan: passed for production source, built assets, and changed docs.
- Raw dataset marker scan: passed.
- External asset scan: no Google Fonts, remote CSS, or remote scripts added. Broad URL scans still catch existing license/help URLs inside comments and bundled React diagnostics.
- WooCommerce write scan: existing allowed writes only in `SafeApplyEngine`; no delete/manual-zone update path added.
- `git diff --check`: passed with line-ending warnings only.
- Runtime repair smoke: passed.
- Browser smoke: passed for post-repair page render/live state; missing-row browser view was not re-tested after REST repair consumed the missing state.

## Known risks

- The repair dialog currently repairs missing setup using current defaults, not edited row prices. This matches the requested repair behavior but merchants should update prices afterward if defaults are not desired.
- Browser smoke did not capture the missing-row UI before repair because the runtime repair smoke used the actual missing Alger/Djelfa case first.
- Enable/disable remains future; disabled-method-only repair cases should continue to route through diagnostics rather than imply write support.

## Blockers

None.

## Next recommended task

TASK-010G: add a focused browser smoke fixture or scripted setup/teardown for missing Shipping Zones states so future UI repair states can be verified visually without relying on manually deleted WooCommerce zones.

## Commit hash

Pending commit.
