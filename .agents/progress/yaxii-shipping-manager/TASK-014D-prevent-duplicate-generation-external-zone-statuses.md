# TASK-014D: Prevent Duplicate Generation for External Yaxii Zones

Date: 2026-07-03

## Goal

Use the TASK-014C read-only compatibility detector to prevent duplicate generation on Yaxii COD Theme stores and show external/theme/duplicate statuses in Shipping Editor.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/014d-prevent-duplicate-generation-external-zone-statuses`
- TASK-014A commit `a86d0ea` exists locally.
- TASK-014C commit `5e30a8e` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Docs/audits read

- `AGENTS.md`
- `CLAUDE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014C-yaxii-cod-readonly-compat-diagnostics.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`

## Scope

Included:

- Frontend external/theme/duplicate status model.
- Shipping Editor read-only statuses and details for compatibility-covered wilayas.
- Generator Start warning/review behavior for Yaxii COD duplicate/state-format risk.
- Generator Coverage locking for external/theme-covered wilayas.
- Preview planner defensive protected skips for external/theme-covered selected wilayas.
- Copy consistency for protected zones.
- Documentation updates.
- Rebuilt admin runtime assets.

Excluded:

- Yaxii COD Theme edits.
- Theme zone adoption, conversion, deletion, or merge tooling.
- Manual-zone adoption.
- `yaxii_zone_map` writes.
- Provider imports, YSF sync, CSV backend, commune-level pricing, telemetry, licensing, Pro locks, remote assets, or hidden calls.

## Files changed

- `admin-app/src/components/generator/GeneratorAdvancedDetails.tsx`
- `admin-app/src/components/generator/GeneratorGenerateStep.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSummary.tsx`
- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesStatusCard.tsx`
- `admin-app/src/components/shipping-zones/StatusBadge.tsx`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/lib/generator/preview-summary.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/diagnostics.ts`
- `admin-app/src/types/preview.ts`
- `admin-app/src/types/shipping-zones.ts`
- `assets/admin/manifest.json`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `src/Apply/ApplyReadinessEvaluator.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-014D-prevent-duplicate-generation-external-zone-statuses.md`
- `assets/admin/assets/main-BQyC6Wv5.js`
- `assets/admin/assets/main-BvJEBEQL.css`

## Files removed

- `assets/admin/assets/main-BbfD9aBQ.js`
- `assets/admin/assets/main-p6PYo8_l.css`

## What was before

TASK-014C added a read-only `compatibility` object and Diagnostics cards, but Shipping Editor still treated Yaxii COD Theme-covered wilayas as plain missing rows and Generator could still select overlapping wilayas for preview/generation.

## What changed

## External/theme status behavior

- `Created by Yaxii COD Theme`: shown when compatibility data says Yaxii COD Theme covers a normalized wilaya and YSM does not.
- `External Yaxii zone`: shown when external Yaxii-looking coverage exists without YSM registry ownership.
- `Duplicate zone`: shown when YSM and Yaxii COD/external coverage both cover the same normalized wilaya.
- These rows are read-only and not repairable or bulk editable.

## Shipping Editor changes

- The Yaxii COD hint now says some wilayas are read-only to prevent duplicate zones.
- Theme/external/duplicate rows do not show editable method controls.
- Theme/external/duplicate rows do not show `Repair setup`.
- Details show source, zone ID, zone name, location format, and method count when available.
- Actions route to Diagnostics and WooCommerce zones.

## Generator prevention behavior

- Start shows `Existing Yaxii COD setup detected` for compatibility findings with duplicate normalized wilayas or state-format mismatch.
- The primary action is Diagnostics review.
- `Continue with safe missing wilayas` is available only when non-overlapping missing wilayas exist.
- Coverage locks external/theme-covered rows out of create/repair selection.
- Locked row copy says `Already covered by Yaxii COD Theme`.
- If no safe missing wilayas exist, Generator shows `No safe wilayas to generate`.
- Preview-only mode remains read-only and does not expose Generate/apply controls.

## Preview/apply defensive behavior

- `PreviewPlanner` reads the existing Diagnostics compatibility object.
- Selected external/theme-covered normalized wilayas are added to protected skips instead of `createZones`.
- The apply contract shape is unchanged; protected skips reuse the existing skipped-zone group.
- SafeApplyEngine write behavior is not expanded to touch external/theme/manual zones.

## Diagnostics copy/links

- TASK-014C Diagnostics cards and advanced compatibility details remain.
- Shipping Editor and Generator actions link to Diagnostics and WooCommerce zones.

## What still remains mocked or not implemented

- No Yaxii COD compatibility bridge exists.
- No adoption/conversion/merge tool exists.
- No `yaxii_zone_map` synchronization exists.
- CSV backend remains not implemented.
- Provider imports remain not implemented.
- YSF Sync remains future/disabled informational scope.
- Commune-level pricing remains not implemented.

## Security notes

- No new REST routes were added.
- No new direct request handling was added.
- No telemetry, remote calls, licensing, external assets, obfuscation, or Pro locks were added.
- Technical compatibility details remain in admin-only Diagnostics/Shipping Editor surfaces.

## WooCommerce safety notes

- External/theme/manual zones remain read-only.
- No WooCommerce zone or method delete path was added.
- No new WooCommerce write path was added outside the existing preview/apply workflow.
- Preview now blocks duplicate creation by classifying external/theme coverage as protected skips.

## WordPress.org compliance notes

- The plugin remains local-first.
- Admin assets remain bundled under `assets/admin`.
- Documentation avoids claiming Yaxii COD checkout compatibility is fixed.
- The UI prevents misleading duplicate-generation success over an existing Yaxii COD setup.

## Checks run

- `composer dump-autoload`
- `php -l src/Preview/PreviewPlanner.php`
- `php -l src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `php -l src/Apply/ApplyReadinessEvaluator.php`
- `php -l src/Apply/SafeApplyEngine.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan
- external asset scan
- WooCommerce write/delete scan
- `yaxii_zone_map` write scan
- theme-file change scan
- local WP-CLI read-only smoke attempt
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `composer dump-autoload`: passed.
- PHP lint: passed for changed PHP files.
- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing 8 Fast Refresh warnings in unrelated UI files.
- `npm run build`: passed with the existing Vite large chunk warning and plugin deprecation notice.
- Source maps under `assets/admin`: `0`.
- Restricted phrase scan: only existing no-telemetry/no-analytics docs and rules matched.
- External asset scan: no source-level Google Fonts, remote CSS, or remote script findings.
- WooCommerce write/delete scan: only existing SafeApplyEngine add-method and managed setup removal delete paths were found.
- `yaxii_zone_map` scan: only the existing detector `get_option( 'yaxii_zone_map', array() )` read and documentation references were found.
- Theme-file change scan: no theme files changed.
- `git diff --check`: passed with line-ending normalization warnings only.
- PHPCS/PHPStan: not run; no repo config exists.

## Local smoke result or blocker

Local read-only WP-CLI smoke was blocked.

- Blocker: `wp eval-file .agents/tmp/task-014d-local-smoke.php` returned `Error establishing a database connection.`
- Evidence: WP-CLI itself is available, but the local WordPress database is unavailable from this checkout.
- Why it matters: local runtime diagnostics and simulated preview checks could not be executed.
- Safe option used: removed the temporary smoke file and relied on typecheck/build/static scans locally, then remote read-only smoke on the deployed demo store.

## Server backup path

`/home/u538716307/backups/yaxii-shipping-manager/task-014d-20260703-133656`

## Files deployed

- `src/Apply/ApplyReadinessEvaluator.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-BQyC6Wv5.js`
- `assets/admin/assets/main-BvJEBEQL.css`

Removed obsolete remote runtime assets:

- `assets/admin/assets/main-BbfD9aBQ.js`
- `assets/admin/assets/main-p6PYo8_l.css`

Not deployed: `.agents`, docs, `admin-app` source, node modules, source maps, hidden dev files, reference apps, or Yaxii COD Theme files.

## Remote read-only smoke result

Passed on `/home/u538716307/domains/demo.yaxii.dev/public_html`.

- Remote manifest points to `assets/main-BQyC6Wv5.js` and `assets/main-BvJEBEQL.css`.
- Remote source maps under `assets/admin`: `0`.
- Plugin active: `yes`.
- WooCommerce active: `yes`.
- Compatibility object exists: `yes`.
- Yaxii COD Theme detected: `yes`.
- Yaxii COD Theme active: `yes`.
- `yaxiiCodZoneMapCount`: `58`.
- `yaxiiCodZoneCount`: `58`.
- `ysmManagedZoneCount`: `69`.
- `normalizedDuplicateWilayaCount`: `58`.
- `stateFormatMismatchDetected`: `yes`.
- `checkoutCompatibilityRisk`: `high`.
- Previewing selected wilaya `01` produced `createZones=0`.
- Previewing selected wilaya `01` produced `skipManualZones=1`.
- First protected skip type: `skip_external_yaxii_zone`.
- First protected skip source: `yaxii_cod_theme`.
- WooCommerce zone count changed during smoke: `no`.
- WooCommerce method count changed during smoke: `no`.
- `yaxii_zone_map` count changed during smoke: `no`.

The first remote smoke invocation failed before WP-CLI execution due to shell quoting. The corrected invocation ran successfully and removed the temporary `/tmp/ysm-task-014d-remote-smoke.php` file.

## What was not changed

- No Yaxii COD Theme files.
- No WooCommerce zones or methods.
- No `yaxii_zone_map` writes.
- No manual-zone adoption.
- No conversion tooling.
- No removal/generator apply was run during local checks.
- No Generator apply or setup removal was run on the server.

## QA guard findings

- `clean-code-guard`: scoped changes reuse existing diagnostics/preview/apply structures; no speculative bridge or adoption abstraction was added.
- `docs-guard`: docs describe implemented behavior only and keep bridge/conversion as not implemented.
- `woo-guard`: no new WooCommerce write/delete path was added; preview prevents duplicate creates for external/theme coverage.
- `wp-guard`: no new request access or public output path was added; changed PHP strings are translation-ready.
- `wp-rest-api`: no REST route or permission shape changed; response additions stay within existing Diagnostics/Preview responses.
- `wp-plugin-directory-guidelines`: no telemetry, licensing, remote assets, obfuscation, upsells, or hidden calls were added.

## Risks

- Local browser/runtime smoke could not run because local WordPress DB is unavailable.
- Remote browser login may still be blocked; WP-CLI/file-level remote smoke is expected to be the proof path.
- The preview skip group still uses the existing `skipManualZones` contract key for compatibility with apply, though merchant copy now says protected zones.
- A full compatibility bridge is still not implemented.

## Blockers

- Local WordPress database connection is unavailable.

## Next recommended task

TASK-014E: add focused automated/unit-style coverage for compatibility-derived Shipping Editor rows and Generator locked selection behavior, or design a future explicit compatibility bridge audit if the product direction requires Yaxii COD checkout interoperability.

## Commit hash, if committed

Initial local commit before deployment report amendment: `8017c37`.

Final amended commit hash is reported in the task closeout because amending this report changes the commit hash.
