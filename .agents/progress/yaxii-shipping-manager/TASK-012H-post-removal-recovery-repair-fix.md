# TASK-012H - Post-Removal Recovery UX and Repair Bug Fix

Date: 2026-06-30

## Goal

Fix the post-removal recovery flow after `Remove Yaxii-managed setup`, and fix the `Pricing row methodStatuses must be an object.` repair failure.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012h-post-removal-recovery-repair-fix`
- Base commit confirmed locally: `8b54c00` (`TASK-012G: add confirmed managed setup removal`)
- Pre-existing unrelated dirty files were present before the task and were left unstaged.
- Commit hash: `f70ea53` before report-hash amend; final amended hash is recorded in the final response.

## Scope

- Repair preview payload construction.
- Preview request sanitizer empty `methodStatuses` handling.
- Read-only diagnostics summary field for managed registry count.
- Shipping Zones post-removal global recovery state.
- Generator post-removal start behavior.
- Read-only manual/protected zone details.
- Documentation and admin bundle rebuild.

No manual-zone adoption, manual-zone update/delete, CSV backend, commune-level pricing, provider import, YSF sync, zone-name apply, telemetry, licensing, Pro locks, remote assets, or new unsafe WooCommerce write path was added.

## Files changed

- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `admin-app/src/types/diagnostics.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-Cy7SkqDr.js`
- `assets/admin/assets/main-qiXySz85.css`
- `assets/admin/assets/main-BnWwT6_c.js` removed by rebuild
- `assets/admin/assets/main-D3MQDYQ7.css` removed by rebuild
- `docs/GENERATOR-WIZARD.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `src/Preview/PreviewRequestSanitizer.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-012H-post-removal-recovery-repair-fix.md`

## What was before

- After removal, Shipping Zones showed many `Missing setup` rows with no global rebuild state.
- Repair requests from missing rows omitted `methodStatuses`; the PHP sanitizer treated the empty fallback as a list and rejected it.
- Generator Start prioritized `Manual zones need review` when one protected manual zone remained after removing all Yaxii-managed setup.
- Manual/protected row details did not show method-level read-only inspection data.

## What changed

- Repair rows now send `methodStatuses: {}`.
- The preview sanitizer now accepts an empty `methodStatuses` map as no status changes.
- Diagnostics summary now exposes `managedRegistryZoneCount`.
- Shipping Zones shows `No Yaxii shipping setup found` when registry count is zero and most/all wilayas are missing.
- The recovery state offers `Create setup` and `View manual zones`.
- Manual-zone notice says `Manual WooCommerce zones found and protected. Yaxii will not edit them.`
- Generator Start now shows `Create a new Yaxii setup` after removal even if manual/protected zones remain.
- Generator Start warns that manual zones exist and adds `Review manual zones`.
- Manual/protected row details now show WooCommerce zone name, matched wilaya code, method names, prices, and enabled/disabled status when readable.
- Manual/protected row details offer only `Open WooCommerce zones` and `Review in Diagnostics`.

## Repair payload bug root cause

`repairContextFromRows()` built repair pricing rows with `wilayaCode`, `enabled`, and `methods`, but no `methodStatuses`.

`PreviewRequestSanitizer::pricing_row()` then used the fallback `array()` for `methodStatuses`. The sanitizer's list detection treats an empty PHP array as a list, so the repair preview failed with:

```text
Pricing row methodStatuses must be an object.
```

## Repair bug fix

- Frontend repair rows include `methodStatuses: {}`.
- Backend sanitizer accepts an empty `methodStatuses` map as an object-equivalent no-op.
- Direct-service smoke previewed DZ:02 with empty `methodStatuses` and returned status `200`.

## Post-removal Shipping Zones state

The page computes a recovery state from diagnostics:

- `managedRegistryZoneCount === 0`
- missing wilayas are most/all of the dataset after allowing protected manual zones
- there are no active/needs-update managed rows

When true, the page shows the global rebuild state above the table.

## Generator post-removal behavior

Generator guidance now checks the empty managed registry plus mostly missing coverage before manual-zone review. In that state it uses the create path and keeps protected manual zones as a warning, not a blocker.

Manual conflicts can still block or skip selected wilayas during Preview/Apply. No manual-zone adoption or update path was added.

## Manual zone details behavior

Expanded manual/protected rows are read-only. They show:

- WooCommerce zone name
- matched wilaya code
- method title
- method price
- enabled/disabled status

The only actions are inspection/navigation actions.

## Runtime smoke result

WP-CLI reached the LocalWP site:

```text
wp option get siteurl -> http://yaxii-ysz.local
```

Direct-service runtime smoke used the same plugin classes as the REST path:

- `PreviewRequestSanitizer`
- `PreviewPlanner`
- `ApplyRequestSanitizer`
- `SafeApplyEngine`
- `ShippingDiagnosticsService`

Initial disposable-store state:

- `managedRegistryZoneCount=0`
- `configuredWilayas=1`
- `missingWilayas=68`
- `totalWilayas=69`
- `manualZoneCount=1`
- protected manual zone `#74 adrar`
- protected manual method `#215 Home delivery 1`, cost `500`, enabled

Controlled repair/create smoke:

- selected safe missing wilaya: `02`
- preview status: `200`
- preview summary: `createZones=1`, `addMethods=0`, `conflicts=0`
- apply status: `200`
- apply result: `applied=true`, `wooCommerceChanged=true`
- created zones: `1`
- created methods: `2`
- skipped manual zones: `0`
- conflicts: `0`

After smoke:

- registry count became `1`
- configured wilayas became `2`
- missing wilayas became `67`
- manual zone `#74 adrar` stayed present with the same one method, title, cost, and enabled status
- selected DZ:02 zone `#75 Yaxii - 02 Chlef - الشلف` has exactly two managed methods: Home delivery `700`, Office delivery `400`

No duplicate methods were created for the controlled wilaya.

## Browser smoke result or blocker

Browser automation was blocked by `agent-browser`.

- `agent-browser doctor --offline --quick` hung with no output and was stopped.
- `agent-browser open http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager&v=012h-smoke` hung and then failed with OS error `10060`.

The UI changes were verified through TypeScript, lint, build, and runtime/direct-service smoke, but not through an interactive browser click in this turn.

## What remains mocked/not implemented

- Manual-zone adoption.
- Manual-zone edit/update/delete.
- Manual-method edit/update/delete.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Zone-name apply/update.
- Exportable cleanup reports.
- Separate registry reconciliation screen.

## Security notes

- No new public route was added.
- No new state-changing REST endpoint was added.
- Existing preview/apply nonce and capability contracts remain unchanged.
- The new diagnostics summary field is read-only.
- No direct superglobal access was added.

## WooCommerce safety notes

- No new WooCommerce write path was added.
- Repair and create still go through preview, apply request sanitization, preview hash/summary validation, and `SafeApplyEngine`.
- Manual zones remain read-only in the UI.
- The runtime smoke created one Yaxii-managed zone only after a safe preview with no conflicts.
- Manual zone `#74` was not edited or deleted.

## WordPress.org compliance notes

- No telemetry, analytics, hidden tracking, licensing, Pro locks, remote calls, external fonts, remote scripts, remote CSS, provider dispatch, or obfuscation was added.
- Documentation describes implemented behavior and keeps unsupported items explicit.
- No public-site links were injected.

## QA guard findings

- `clean-code-guard`: scoped changes to existing helpers/components; no speculative manual adoption or new apply abstraction.
- `docs-guard`: updated docs to match implemented UI and sanitizer behavior; no unsupported feature claims added.
- `woo-guard`: no manual zone/method writes; one controlled safe-apply smoke used the existing engine.
- `wp-guard`: read-only diagnostics field only; no new unsafe request handling.
- `wp-rest-api`: no route contract changed except existing diagnostics response shape; preview/apply permissions remain unchanged.
- `wp-plugin-directory-guidelines`: no remote dependency, tracking, obfuscation, or upsell surface added.

## Checks run

- `composer dump-autoload`
- `php -l src/Preview/PreviewRequestSanitizer.php`
- `php -l src/WooCommerce/ShippingDiagnosticsService.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- raw dataset bundling scan over built JS
- targeted external asset scan
- WooCommerce write/delete diff scan
- WP-CLI/direct-service runtime smoke
- browser smoke attempt with `agent-browser`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Composer autoload regenerated successfully.
- PHP lint passed for changed PHP files.
- TypeScript typecheck passed.
- ESLint passed with 8 existing Fast Refresh warnings in shared UI files.
- Admin build passed with the existing Vite tsconfig-paths notice and large chunk warning.
- Source map scan passed; no `.map` files under `assets/admin`.
- Restricted phrase scan over product source/assets returned no matches.
- Raw dataset bundling scan over built JS returned no matches.
- Targeted external asset scan returned no remote CSS/script/font matches.
- WooCommerce write/delete diff scan showed no new delete path, manual-zone update path, or manual-method update path.
- Direct-service runtime smoke passed for preview and apply.
- Browser automation blocked by `agent-browser` error `10060`.
- `git diff --check` passed with line-ending warnings only.

PHPCS and PHPStan were not run because no `phpcs.xml`, `phpcs.xml.dist`, or `phpstan.neon` is configured in this plugin root.

## Known risks

- Browser UI behavior still needs manual or working automation verification.
- The disposable LocalWP store is no longer at registry count `0`; the runtime smoke created one managed DZ:02 zone safely.
- The admin JS bundle remains above Vite's size warning threshold.
- Existing unrelated dirty files remain in the worktree.

## Blockers

- `agent-browser` could not run browser smoke.

## Next recommended task

Run a manual/browser smoke once `agent-browser` is healthy, then decide whether to add a registry reconciliation screen for stores that have orphaned managed records or partially removed managed methods.
