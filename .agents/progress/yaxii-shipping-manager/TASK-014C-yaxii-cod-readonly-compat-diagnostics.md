# TASK-014C: Yaxii COD Read-Only Compatibility Diagnostics

Date: 2026-07-02

## Goal

Add read-only Yaxii COD Theme compatibility detection and Diagnostics visibility for mixed Algeria shipping setups without writing, adopting, deleting, converting, or repairing WooCommerce zones.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/014c-yaxii-cod-readonly-compat-diagnostics`
- TASK-014A commit `a86d0ea` exists locally.
- TASK-014B2 commit `f36e296` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Docs and audits read

- `AGENTS.md`
- `CLAUDE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014B2-settings-notice-flash-fix.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/GENERATOR-WIZARD.md`

## Scope

Included:

- Read-only backend compatibility detector.
- Additive Diagnostics `compatibility` response object.
- Diagnostics compatibility cards.
- Collapsed advanced compatibility details.
- Non-blocking Shipping Editor hint.
- Rebuilt admin runtime assets.
- Local checks and read-only smoke.

Excluded:

- WooCommerce zone or method writes.
- `yaxii_zone_map` writes.
- Yaxii COD Theme source edits.
- SafeApplyEngine behavior changes.
- Generator apply/prevention changes.
- Zone adoption, conversion, merge, repair, or delete tooling.
- Provider imports, YSF sync, telemetry, licensing, Pro locks, remote assets, or hidden calls.

## Detector behavior

Added `src/WooCommerce/YaxiiCodCompatibilityDetector.php`.

The detector reads only:

- WooCommerce shipping zones passed from the existing read-only `ShippingZoneReader`.
- `yaxii_shipping_manager_managed_zones` through `ManagedZoneRegistry`.
- Yaxii COD Theme `yaxii_zone_map` through `get_option()`.
- Active theme name, stylesheet, and template through `wp_get_theme()`.
- Dataset current and legacy-58 status through `DatasetRepository`.

It never calls WooCommerce create/update/delete APIs and never writes options.

## Normalization rules

- `DZ:01` -> normalized wilaya code `01`, source format `ysm_current`.
- `DZ:DZ-01` -> normalized wilaya code `01`, source format `yaxii_cod_theme`.
- `DZ-01` -> normalized wilaya code `01`, source format `theme_state_key`.
- `yaxii_zone_map["DZ-01"]` -> normalized wilaya code `01`, source format `theme_zone_map`.

## Diagnostics response fields

Diagnostics now includes a read-only `compatibility` object with:

- `yaxiiCodThemeDetected`
- `yaxiiCodThemeActive`
- `yaxiiCodZoneMapDetected`
- `yaxiiCodZoneMapCount`
- `yaxiiCodZoneCount`
- `ysmManagedZoneCount`
- `normalizedDuplicateWilayaCount`
- `legacyOnlyCoverageDetected`
- `stateFormatMismatchDetected`
- `checkoutCompatibilityRisk`
- `activeTheme`
- `zonesByNormalizedWilaya`
- `duplicateNormalizedWilayas`
- `warnings`
- `recommendations`

If WooCommerce is inactive, the object returns safe empty values.

## Diagnostics UI cards

Diagnostics now conditionally shows these read-only cards only when findings exist:

- `Existing Yaxii COD setup detected`
- `Duplicate shipping zones found`
- `State code format mismatch`
- `Checkout compatibility warning`

The cards use merchant wording and do not claim compatibility is fixed.

## Advanced details behavior

Advanced details remain collapsed by default.

When opened, the compatibility section shows:

- active theme name, stylesheet, template, and Yaxii COD detection flag;
- whether `yaxii_zone_map` exists;
- theme mapped zone count;
- YSM managed zone count;
- theme-format zone count;
- duplicate normalized wilaya count;
- checkout compatibility risk;
- duplicate normalized wilayas with zone ID, zone name, location format, and source classification;
- recommendations.

## Shipping Editor hint

Shipping Editor shows this non-blocking info hint when Yaxii COD setup is detected:

`Existing Yaxii COD shipping setup detected. Review Diagnostics before generating new zones.`

The hint does not change row statuses, block Generator, adopt zones, or edit theme-owned zones.

## Files changed

- `admin-app/src/api/diagnostics-api.ts`
- `admin-app/src/components/diagnostics/DiagnosticsAdvancedDetails.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/types/diagnostics.ts`
- `assets/admin/manifest.json`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `src/Plugin.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`

Generated admin runtime asset changes:

- Removed `assets/admin/assets/main-Bek0twC3.css`
- Removed `assets/admin/assets/main-DmGTUSNe.js`
- Created `assets/admin/assets/main-BbfD9aBQ.js`
- Created `assets/admin/assets/main-p6PYo8_l.css`

## Files created

- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `.agents/progress/yaxii-shipping-manager/TASK-014C-yaxii-cod-readonly-compat-diagnostics.md`
- `assets/admin/assets/main-BbfD9aBQ.js`
- `assets/admin/assets/main-p6PYo8_l.css`

Temporary file created, run, and deleted before final diff:

- `.agents/tmp/task-014c-compat-smoke.php`

## What was before

Diagnostics matched Yaxii Shipping Manager zones only through direct `DZ:NN` state locations. It did not normalize Yaxii COD Theme `DZ:DZ-NN` locations, raw `DZ-NN` state keys, or `yaxii_zone_map` entries, so existing theme zones could be invisible to duplicate/conflict diagnostics.

## What changed

Diagnostics now reports mixed YSM/Yaxii COD/theme/manual Algeria zone signals read-only. The admin UI surfaces findings through Diagnostics cards, collapsed advanced details, and a non-blocking Shipping Editor hint.

## What still remains mocked or not implemented

- No Yaxii COD bridge exists.
- No theme zone adoption/conversion exists.
- Generator is not blocked by compatibility findings yet.
- SafeApplyEngine behavior is unchanged.
- CSV import/export backend remains not implemented.
- Provider dispatch remains not implemented.
- YSF Sync remains future/disabled informational scope.
- Commune-level pricing remains not implemented.

## Security notes

- No new remote calls, telemetry, tracking, licensing, obfuscation, or external assets were added.
- No new public endpoint was added.
- Diagnostics remains permission-protected through the existing controller.
- Technical zone IDs and location formats are kept in advanced details.
- A temporary local admin user was created for browser smoke and deleted after the browser session timed out.

## WooCommerce safety notes

- No WooCommerce zone or method was created, updated, deleted, adopted, or normalized.
- No `yaxii_zone_map` update path was added.
- No SafeApplyEngine or Generator apply behavior changed.
- The WooCommerce write/delete scan showed only existing SafeApply, registry, and settings write paths. The new compatibility detector only reads `yaxii_zone_map`.

## WordPress.org compliance notes

- The plugin remains local-first.
- Admin assets remain bundled locally under `assets/admin`.
- No Google Fonts, remote CSS, remote scripts, hidden calls, telemetry, analytics, licensing, or Pro locks were added.
- Documentation describes only implemented read-only behavior and explicitly says compatibility is not fixed.

## Local checks

- `composer dump-autoload`
- `php -l src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `php -l src/WooCommerce/ShippingDiagnosticsService.php`
- `php -l src/Plugin.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan
- external asset scan
- WooCommerce write/delete scan
- local WP-CLI read-only diagnostics and simulated normalization smoke
- local browser smoke attempt
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `composer dump-autoload`: passed.
- PHP lint: passed for changed PHP files.
- `npm run typecheck`: passed.
- `npm run lint`: passed with existing fast-refresh warnings in unrelated UI files.
- `npm run build`: passed with the existing Vite large chunk warning.
- Source maps under `assets/admin`: `0`.
- Restricted phrase scan: only existing no-telemetry/no-analytics docs and rules matched.
- External asset scan: no Google Fonts, no remote CSS imports, no remote scripts or styles enqueued.
- WooCommerce write/delete scan: no new write/delete path; new detector uses `get_option( 'yaxii_zone_map', array() )` only.
- `git diff --check`: passed with line-ending normalization warnings only.

## Local smoke result

WP-CLI read-only smoke:

- `normalize_current={"normalizedWilayaCode":"01","sourceFormat":"ysm_current"}`
- `normalize_theme_location={"normalizedWilayaCode":"01","sourceFormat":"yaxii_cod_theme"}`
- `normalize_theme_key={"normalizedWilayaCode":"01","sourceFormat":"theme_state_key"}`
- `runtime_has_compatibility=yes`
- `runtime_woocommerce_active=yes`
- `runtime_compatibility_warnings=0`
- simulated mixed setup: `simulated_zone_map_count=1`
- simulated mixed setup: `simulated_theme_zone_count=1`
- simulated mixed setup: `simulated_ysm_managed_count=1`
- simulated mixed setup: `simulated_duplicate_count=1`
- simulated mixed setup: `simulated_state_mismatch=yes`
- simulated mixed setup: `simulated_checkout_risk=medium`

Local browser smoke:

- Browser reached the WordPress login page.
- Temporary local administrator user ID `18` was created.
- The browser/session timed out while waiting for wp-admin after login submission.
- Temporary local administrator user ID `18` was deleted.
- Manual browser UI verification remains blocked by the local browser/session timeout.

## Server backup path

`/home/u538716307/backups/yaxii-shipping-manager/task-014c-20260703-001008`

## Files deployed

Remote plugin path:

`/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager`

Deployed runtime files:

- `src/Plugin.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-BbfD9aBQ.js`
- `assets/admin/assets/main-p6PYo8_l.css`

Deployment correction:

- The first PHP `scp` command accidentally copied `src/Plugin.php` to `src/WooCommerce/Plugin.php`.
- `src/Plugin.php` was then copied to the correct remote path.
- The accidental duplicate was removed from exactly `/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager/src/WooCommerce/Plugin.php`.
- No Yaxii COD Theme files, docs, `.agents`, node modules, source maps, or database rows were deployed or changed.

## Remote read-only smoke result

- Remote manifest points to `assets/main-BbfD9aBQ.js` and `assets/main-p6PYo8_l.css`.
- Remote `assets/admin/assets/main-BbfD9aBQ.js` exists.
- Remote `assets/admin/assets/main-p6PYo8_l.css` exists.
- Remote PHP runtime files exist.
- Remote `assets/admin` source-map count: `0`.
- Remote WP-CLI reports `yaxii-shipping-manager` active.
- Remote read-only diagnostics smoke returned:
  - `plugin_active=yes`
  - `woocommerce_active=yes`
  - `compatibility_exists=yes`
  - `yaxii_cod_theme_detected=yes`
  - `yaxii_cod_theme_active=yes`
  - `yaxii_cod_zone_map_detected=yes`
  - `yaxii_cod_zone_map_count=58`
  - `yaxii_cod_zone_count=58`
  - `ysm_managed_zone_count=69`
  - `normalized_duplicate_count=58`
  - `state_format_mismatch=yes`
  - `checkout_compatibility_risk=high`
  - `compatibility_warning_count=4`
- The remote smoke emitted WooCommerce PHP warnings for missing state labels while reading existing zone locations `01` through `69`, but it did not fatal and still returned the compatibility object.
- The remote smoke did not run Generator apply, managed setup removal, WooCommerce zone writes, WooCommerce deletes, or any manual database update.
- Temporary remote smoke file `/tmp/ysm-task-014c-remote-smoke.php` was removed after the smoke.

## What was not changed

- No Yaxii COD Theme files.
- No WooCommerce zones or methods.
- No `yaxii_zone_map` writes.
- No SafeApplyEngine behavior.
- No Generator apply/prevention behavior.
- No removal/delete tooling.
- No provider imports.
- No YSF sync.
- No telemetry, licensing, Pro locks, remote assets, or hidden calls.

## QA guard findings

- `clean-code-guard`: scoped service/controller wiring; no speculative write abstraction; no hardcoded production success.
- `docs-guard`: docs and report describe actual read-only behavior and avoid claiming compatibility is fixed.
- `woo-guard`: no WooCommerce writes were added; WooCommerce read access stays guarded by existing active check.
- `wp-guard`: no raw request handling or new output path in PHP; new option read is sanitized by normalization before use.
- `wp-rest-api`: existing read-only Diagnostics route and permission callback are unchanged; response shape is additive.
- `wp-plugin-directory-guidelines`: no licensing, telemetry, remote assets, obfuscation, or upsell behavior added.

## Risks

- Browser UI verification is not complete locally because the browser session timed out after login submission.
- Remote browser login was blocked in the previous task and may remain blocked.
- Remote read-only diagnostics currently emits WooCommerce warnings for YSM `DZ:NN` state labels when Yaxii COD Theme state registration is active; this should be reviewed separately because it existed in the read path and is not fixed by this task.
- Generator is still not prevented from creating overlapping zones; this is intentionally deferred.
- Yaxii COD checkout compatibility is only warned about; no bridge exists.

## Blockers

Local browser UI verification blocker:

- Blocker: `agent-browser wait --url "**/wp-admin/**"` timed out after login submission.
- Evidence: login form filled through semantic locators, Enter submitted, then agent-browser reported connection timeout.
- Why it matters: visible Diagnostics cards and collapsed advanced details could not be browser-confirmed locally.
- Safe options: verify manually in an existing authenticated browser session, or investigate local browser/session connectivity separately.
- Recommended option: use WP-CLI and file-level verification for TASK-014C, then manually confirm UI in an authenticated wp-admin session.

## Next recommended task

TASK-014D: add Generator prevention/review-only behavior for external Yaxii COD/theme duplicate normalized wilayas, still without adoption or conversion.

## Commit hash, if committed

Final amended commit hash is reported in the task closeout.
